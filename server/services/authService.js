import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/server/utils/db";
import User from "@/server/models/User";
import Session from "@/server/models/Session";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    title: userDoc.title ?? null,
    role: userDoc.role,
    team: userDoc.team ? userDoc.team.toString() : null,
    avatarUrl: userDoc.avatarUrl ?? null,
  };
}

/**
 * Checks email + password against User.passwordHash. Returns the sanitized
 * user (never the hash) on success, or null on any failure — invalid email,
 * wrong password, or a deactivated account all fail the same way so a client
 * can't distinguish "no such user" from "wrong password".
 */
export async function verifyCredentials(email, password) {
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail, isActive: true }).select("+passwordHash");
  if (!user) return null;

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) return null;

  return sanitizeUser(user);
}

/**
 * Creates a new server-side session for a user and returns the opaque token
 * to store in the session cookie. The token itself is the credential — it is
 * never re-derivable from anything else, so the cookie must stay HttpOnly.
 */
export async function createSession(userId) {
  await connectDB();
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await Session.create({ sessionToken, user: userId, expiresAt });
  return { token: sessionToken, expiresAt };
}

export async function deleteSession(token) {
  if (!token) return;
  await connectDB();
  await Session.deleteOne({ sessionToken: token });
}

/**
 * Resolves a session token to its user, or null if the token is missing,
 * unknown, expired, or belongs to a deactivated account.
 */
export async function getSessionUser(token) {
  if (!token) return null;
  await connectDB();
  const session = await Session.findOne({
    sessionToken: token,
    expiresAt: { $gt: new Date() },
  }).populate("user");

  if (!session?.user || !session.user.isActive) return null;
  return sanitizeUser(session.user);
}
