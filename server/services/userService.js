import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/server/utils/db";
import User, { USER_ROLES } from "@/server/models/User";
import Ticket from "@/server/models/Ticket";
import Session from "@/server/models/Session";
import { HttpError } from "@/server/utils/http-error";
import { recordAudit } from "@/server/services/auditService";
import { generateToken, hashToken } from "@/server/utils/token";
import { sendAgentInviteEmail, sendAgentPasswordResetEmail } from "@/server/email/emailService";

const BCRYPT_SALT_ROUNDS = 10;
const INVITE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

/** An unusable placeholder hash — bcrypt of a random value nobody will ever type. Used while an account is invited/reset-pending so login can never succeed until a real password is set. */
async function unusablePasswordHash() {
  return bcrypt.hash(crypto.randomBytes(32).toString("hex"), BCRYPT_SALT_ROUNDS);
}

/**
 * Directory of active users an authenticated caller may assign a ticket to.
 * Only non-sensitive fields are selected — never passwordHash.
 */
export async function listAssignableUsers() {
  await connectDB();
  return User.find({ isActive: true }).select("name email role team").sort({ name: 1 });
}

/**
 * Full user roster for the admin agents screen. Never returns
 * passwordHash/passwordSetupTokenHash themselves — `hasPendingInvite` is
 * the only thing derived from the latter, computed here rather than left
 * for a route/component to reconstruct.
 */
export async function listUsersForAdmin() {
  await connectDB();
  const users = await User.find().select("+passwordSetupTokenHash").sort({ name: 1 });
  return users.map((user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team,
    title: user.title,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
    hasPendingInvite: Boolean(user.passwordSetupTokenHash),
  }));
}

/**
 * Creates a new agent/team-lead/admin account with no usable password of
 * its own — agents are admin-created, never self-registered (architecture
 * decision), so instead of an admin choosing a password on someone else's
 * behalf, this generates a one-time invite link the new agent uses to set
 * their own password (see setPasswordWithToken). Only reachable from
 * app/api/admin/users/route.js, which already restricted the caller to
 * admins — `actingUser` here is that same server-derived session user, used
 * only for the audit trail.
 */
export async function createUser({ name, email, role, team, title }, actingUser) {
  await connectDB();

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new HttpError(409, "A user with this email already exists.", {
      code: "validation_error",
      fieldErrors: { email: "Must be unique." },
    });
  }

  const { token, tokenHash } = generateToken();
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: await unusablePasswordHash(),
    passwordSetupTokenHash: tokenHash,
    passwordSetupTokenExpiresAt: new Date(Date.now() + INVITE_TOKEN_TTL_MS),
    role: role ?? "agent",
    team: team || undefined,
    title,
  });

  await recordAudit({
    actingUser,
    action: "user.create",
    entityType: "User",
    entityId: user._id,
    metadata: { email: user.email, role: user.role },
  });

  await sendAgentInviteEmail(user, token);

  return User.findById(user._id).select("name email role team title isActive avatarUrl");
}

/**
 * Admin-triggered "reset this agent's password" — generates a fresh
 * invite-style token and emails it, same mechanism as createUser's invite.
 * Useful when an agent is locked out and can't use their own forgot-password
 * flow (agents don't get self-service password reset — only admins can
 * act on their account, matching "agents cannot self-register/self-manage").
 */
export async function resetUserPassword(id, actingUser) {
  await connectDB();
  const user = await User.findById(id);
  if (!user) return null;

  const { token, tokenHash } = generateToken();
  // Invalidates the current password immediately, not just after the new
  // link is used — the whole point of an admin-triggered reset (e.g. a
  // suspected compromise) is that the old password stops working right
  // away, the same way createUser's invite never leaves a usable password
  // sitting there in the meantime.
  user.passwordHash = await unusablePasswordHash();
  user.passwordSetupTokenHash = tokenHash;
  user.passwordSetupTokenExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);
  await user.save();

  await recordAudit({
    actingUser,
    action: "user.reset_password",
    entityType: "User",
    entityId: user._id,
    metadata: { email: user.email },
  });

  await sendAgentPasswordResetEmail(user, token);
  return true;
}

/**
 * Completes an invite or admin-triggered reset: verifies the token, sets a
 * real password, and clears the pending-token fields so the link can't be
 * reused. Throws HttpError(400) for an invalid/expired token.
 */
export async function setPasswordWithToken(token, newPassword) {
  await connectDB();
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordSetupTokenHash: tokenHash,
    passwordSetupTokenExpiresAt: { $gt: new Date() },
  }).select("+passwordSetupTokenHash +passwordSetupTokenExpiresAt");

  if (!user) {
    throw new HttpError(400, "This link is invalid or has expired.", { code: "invalid_token" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  user.passwordSetupTokenHash = undefined;
  user.passwordSetupTokenExpiresAt = undefined;
  await user.save();

  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

/**
 * Permanently removes an agent account — distinct from disabling
 * (isActive:false, see updateUser), which is reversible and keeps history
 * intact. Their tickets are unassigned rather than left pointing at a
 * deleted user, and their sessions are invalidated immediately. A caller
 * may not remove their own account (would lock the admin doing it out
 * mid-action with no one to undo it). Returns null if the user doesn't
 * exist.
 */
export async function deleteUser(id, actingUser) {
  if (String(id) === String(actingUser.id)) {
    throw new HttpError(400, "You cannot remove your own account.", { code: "validation_error" });
  }

  await connectDB();
  const user = await User.findById(id);
  if (!user) return null;

  await Ticket.updateMany({ assignee: user._id }, { $set: { assignee: null } });
  await Session.deleteMany({ user: user._id });
  await user.deleteOne();

  await recordAudit({
    actingUser,
    action: "user.delete",
    entityType: "User",
    entityId: id,
    metadata: { email: user.email, role: user.role },
  });

  return true;
}

/**
 * Updates a user's role/team/active status/title (never email or password
 * through this path — that's a distinct, more sensitive operation this task
 * doesn't need). Returns null if the user doesn't exist.
 */
export async function updateUser(id, patch, actingUser) {
  await connectDB();

  const update = {};
  if (patch.role !== undefined) {
    if (!USER_ROLES.includes(patch.role)) {
      throw new HttpError(400, "Invalid role.", { code: "validation_error", fieldErrors: { role: "Unknown role." } });
    }
    update.role = patch.role;
  }
  if (patch.team !== undefined) update.team = patch.team || null;
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.isActive !== undefined) update.isActive = Boolean(patch.isActive);

  const user = await User.findByIdAndUpdate(id, { $set: update }, { returnDocument: "after", runValidators: true }).select(
    "name email role team title isActive avatarUrl"
  );
  if (!user) return null;

  await recordAudit({
    actingUser,
    action: "user.update",
    entityType: "User",
    entityId: user._id,
    metadata: update,
  });

  return user;
}

/**
 * Self-service profile update — name/title only, called with the caller's
 * own id from the session (see app/api/users/me/route.js). Deliberately a
 * separate, narrower function from updateUser rather than that function
 * reused with a restricted patch: this guarantees role/team/isActive can
 * never reach this path, even if updateUser's allowed fields changed later.
 */
export async function updateOwnProfile(userId, { name, title }) {
  await connectDB();

  const update = {};
  if (name !== undefined) update.name = name;
  if (title !== undefined) update.title = title;

  const user = await User.findByIdAndUpdate(userId, { $set: update }, { returnDocument: "after", runValidators: true }).select(
    "name email role team title isActive avatarUrl"
  );
  if (!user) return null;

  await recordAudit({ actingUser: user, action: "user.profile_update", entityType: "User", entityId: user._id, metadata: update });

  return user;
}

/** Self-service avatar update — persists the URL an upload already produced (see app/api/users/me/avatar/route.js). */
export async function updateOwnAvatar(userId, avatarUrl) {
  await connectDB();
  const user = await User.findByIdAndUpdate(userId, { $set: { avatarUrl } }, { returnDocument: "after" }).select(
    "name email role team title isActive avatarUrl"
  );
  if (!user) return null;

  await recordAudit({ actingUser: user, action: "user.avatar_update", entityType: "User", entityId: user._id });

  return user;
}

/**
 * Self-service password change: verifies `currentPassword` before accepting
 * `newPassword` (never trusts a client claim that it's already been
 * checked), then invalidates every other active session for this account —
 * the same "old credential stops working immediately" principle
 * resetUserPassword already applies to an admin-triggered reset, extended
 * here to sessions rather than the password itself, since the caller just
 * proved they know the current one. `currentSessionToken` (the token making
 * this very request) is excluded so changing your password doesn't also log
 * you out.
 */
export async function changeOwnPassword(userId, currentPassword, newPassword, currentSessionToken) {
  await connectDB();

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw new HttpError(404, "User not found.", { code: "not_found" });
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw new HttpError(400, "Current password is incorrect.", {
      code: "validation_error",
      fieldErrors: { currentPassword: "Incorrect password." },
    });
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await user.save();

  await Session.deleteMany({ user: user._id, sessionToken: { $ne: currentSessionToken } });

  // No metadata beyond the fact that it happened — a password change has
  // nothing safe/useful to record about *what* changed, only *that* it did.
  await recordAudit({ actingUser: user, action: "user.password_change", entityType: "User", entityId: user._id });

  return true;
}
