import bcrypt from "bcryptjs";
import { connectDB } from "@/server/utils/db";
import User, { USER_ROLES } from "@/server/models/User";
import { HttpError } from "@/server/utils/http-error";
import { recordAudit } from "@/server/services/auditService";

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Directory of active users an authenticated caller may assign a ticket to.
 * Only non-sensitive fields are selected — never passwordHash.
 */
export async function listAssignableUsers() {
  await connectDB();
  return User.find({ isActive: true }).select("name email role team").sort({ name: 1 });
}

/** Full user roster for the admin agents screen — still never selects passwordHash. */
export async function listUsersForAdmin() {
  await connectDB();
  return User.find().select("name email role team title isActive avatarUrl").sort({ name: 1 });
}

/**
 * Creates a new agent/team-lead/admin account. Only reachable from
 * app/api/admin/users/route.js, which already restricted the caller to
 * admins — `actingUser` here is that same server-derived session user, used
 * only for the audit trail.
 */
export async function createUser({ name, email, password, role, team, title }, actingUser) {
  await connectDB();

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new HttpError(409, "A user with this email already exists.", {
      code: "validation_error",
      fieldErrors: { email: "Must be unique." },
    });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
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

  return User.findById(user._id).select("name email role team title isActive avatarUrl");
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
