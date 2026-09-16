import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/server/utils/db";
import Customer from "@/server/models/Customer";
import CustomerSession from "@/server/models/CustomerSession";
import { HttpError } from "@/server/utils/http-error";
import { generateToken, hashToken } from "@/server/utils/token";
import { sendCustomerPasswordResetEmail } from "@/server/email/emailService";
import { recordAudit } from "@/server/services/auditService";

/**
 * Customer-facing counterpart to server/services/authService.js — kept as a
 * separate module (not a shared "authService" with a discriminator) since
 * customer and staff auth have different rules (self-registration, no
 * roles, a different session cookie/model — see CustomerSession.js) and
 * mixing them would make both harder to reason about.
 */

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const BCRYPT_SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

function sanitizeCustomer(customerDoc) {
  return {
    id: customerDoc._id.toString(),
    name: customerDoc.name,
    email: customerDoc.email,
    phone: customerDoc.phone ?? null,
    company: customerDoc.company ?? null,
    plan: customerDoc.plan,
    avatarUrl: customerDoc.avatarUrl ?? null,
  };
}

/**
 * Creates a new customer account, or attaches a password to an existing
 * customer record that doesn't have one yet (e.g. one created by an agent
 * on the customer's behalf, or seeded — see Customer.js's passwordHash
 * comment). Rejects outright if the email is already a fully registered
 * (password-having) account.
 */
export async function registerCustomer({ name, email, password, company, phone }) {
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await Customer.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (existing?.passwordHash) {
    throw new HttpError(409, "An account with this email already exists.", {
      code: "validation_error",
      fieldErrors: { email: "Already registered — try signing in instead." },
    });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  if (existing) {
    existing.passwordHash = passwordHash;
    if (company) existing.company = company;
    if (phone) existing.phone = phone;
    await existing.save();
    return sanitizeCustomer(existing);
  }

  const customer = await Customer.create({ name, email: normalizedEmail, passwordHash, company, phone });
  return sanitizeCustomer(customer);
}

/**
 * Same contract as authService.verifyCredentials: null for any failure
 * (unknown email, no password set yet, wrong password) so a client can't
 * distinguish which.
 */
export async function verifyCustomerCredentials(email, password) {
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();
  const customer = await Customer.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!customer?.passwordHash) return null;

  const matches = await bcrypt.compare(password, customer.passwordHash);
  if (!matches) return null;

  return sanitizeCustomer(customer);
}

export async function createCustomerSession(customerId) {
  await connectDB();
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await CustomerSession.create({ sessionToken, customer: customerId, expiresAt });
  return { token: sessionToken, expiresAt };
}

export async function deleteCustomerSession(token) {
  if (!token) return;
  await connectDB();
  await CustomerSession.deleteOne({ sessionToken: token });
}

export async function getCustomerSessionUser(token) {
  if (!token) return null;
  await connectDB();
  const session = await CustomerSession.findOne({
    sessionToken: token,
    expiresAt: { $gt: new Date() },
  }).populate("customer");

  if (!session?.customer) return null;
  return sanitizeCustomer(session.customer);
}

/**
 * Always succeeds from the caller's point of view (the route returns the
 * same generic message whether or not the email exists) — only emails a
 * reset link if a matching, already-registered account is found. This is
 * the standard mitigation for account enumeration via a forgot-password
 * form.
 */
export async function requestPasswordReset(email) {
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();
  const customer = await Customer.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!customer?.passwordHash) return;

  const { token, tokenHash } = generateToken();
  customer.passwordResetTokenHash = tokenHash;
  customer.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await customer.save();

  await sendCustomerPasswordResetEmail(customer, token);
}

/**
 * Self-service profile update — name/phone/company only. `plan` is
 * deliberately not updatable here (billing-controlled, stays admin-only —
 * see the portal profile page's copy), and email/password each have their
 * own dedicated, more sensitive flow.
 */
export async function updateOwnProfile(customerId, { name, phone, company }) {
  await connectDB();

  const update = {};
  if (name !== undefined) update.name = name;
  if (phone !== undefined) update.phone = phone;
  if (company !== undefined) update.company = company;

  const customer = await Customer.findByIdAndUpdate(customerId, { $set: update }, { returnDocument: "after", runValidators: true });
  if (!customer) return null;

  const sanitized = sanitizeCustomer(customer);
  await recordAudit({
    actingUser: sanitized,
    actorModel: "Customer",
    action: "customer.profile_update",
    entityType: "Customer",
    entityId: customer._id,
    metadata: update,
  });

  return sanitized;
}

/** Self-service avatar update — persists the URL an upload already produced (see app/api/portal/customers/me/avatar/route.js). */
export async function updateOwnAvatar(customerId, avatarUrl) {
  await connectDB();
  const customer = await Customer.findByIdAndUpdate(customerId, { $set: { avatarUrl } }, { returnDocument: "after" });
  if (!customer) return null;

  const sanitized = sanitizeCustomer(customer);
  await recordAudit({
    actingUser: sanitized,
    actorModel: "Customer",
    action: "customer.avatar_update",
    entityType: "Customer",
    entityId: customer._id,
  });

  return sanitized;
}

/**
 * Self-service password change — same shape as userService.changeOwnPassword:
 * verifies currentPassword server-side, then invalidates every other active
 * session for this account (currentSessionToken is excluded so this doesn't
 * also log the caller out). A customer with no password set yet (see the
 * model's passwordHash comment) can never pass the current-password check,
 * which is the correct outcome — there's nothing to "change" until they've
 * registered or reset one.
 */
export async function changeOwnPassword(customerId, currentPassword, newPassword, currentSessionToken) {
  await connectDB();

  const customer = await Customer.findById(customerId).select("+passwordHash");
  if (!customer?.passwordHash) {
    throw new HttpError(400, "Current password is incorrect.", {
      code: "validation_error",
      fieldErrors: { currentPassword: "Incorrect password." },
    });
  }

  const matches = await bcrypt.compare(currentPassword, customer.passwordHash);
  if (!matches) {
    throw new HttpError(400, "Current password is incorrect.", {
      code: "validation_error",
      fieldErrors: { currentPassword: "Incorrect password." },
    });
  }

  customer.passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await customer.save();

  await CustomerSession.deleteMany({ customer: customer._id, sessionToken: { $ne: currentSessionToken } });

  // No metadata beyond the fact that it happened — same reasoning as
  // userService.changeOwnPassword.
  await recordAudit({
    actingUser: sanitizeCustomer(customer),
    actorModel: "Customer",
    action: "customer.password_change",
    entityType: "Customer",
    entityId: customer._id,
  });

  return true;
}

/** Resets a password from a valid, unexpired token. Throws HttpError(400) otherwise. */
export async function resetPasswordWithToken(token, newPassword) {
  await connectDB();
  const tokenHash = hashToken(token);
  const customer = await Customer.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpiresAt");

  if (!customer) {
    throw new HttpError(400, "This reset link is invalid or has expired.", { code: "invalid_token" });
  }

  customer.passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  customer.passwordResetTokenHash = undefined;
  customer.passwordResetExpiresAt = undefined;
  await customer.save();

  return sanitizeCustomer(customer);
}
