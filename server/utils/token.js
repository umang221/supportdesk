import crypto from "node:crypto";

/**
 * Shared helper for one-time link tokens (agent invite/reset, customer
 * password reset). The raw token is what goes in the emailed link/URL and
 * is never stored; only its SHA-256 hash is persisted, so a database
 * read/leak doesn't hand over a usable token the way storing it in plain
 * text would (same reasoning as a password hash, just a faster one-way
 * hash since these are high-entropy random values, not low-entropy
 * user-chosen secrets that need bcrypt's slowness).
 */
export function generateToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
