import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/server/utils/db";
import Customer from "@/server/models/Customer";
import CustomerSession from "@/server/models/CustomerSession";
import { HttpError } from "@/server/utils/http-error";
import { generateToken, hashToken } from "@/server/utils/token";
import { sendCustomerPasswordResetEmail } from "@/server/email/emailService";

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
