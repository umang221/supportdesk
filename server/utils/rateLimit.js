/**
 * Minimal in-memory sliding-window rate limiter for sensitive,
 * unauthenticated endpoints (currently just login — see
 * app/api/auth/login/route.js). Deliberately not Redis: this app is a
 * single Node process (same reasoning as server/jobs/jobRunner.js and
 * server/realtime/eventBus.js), so an in-memory Map is enough to stop
 * scripted brute-force/credential-stuffing without new infrastructure. It
 * would need to move to a shared store only if this app ever ran as
 * multiple instances behind a load balancer.
 *
 * Cached on `global` for the same reason as connectDB/eventBus: Next.js dev
 * mode clears the module cache on every hot reload, which would otherwise
 * reset every caller's attempt history on each edit.
 */
let hits = global._rateLimitHits;
if (!hits) {
  hits = global._rateLimitHits = new Map();
}

// Bounds how much memory stale keys can hold if never swept by a fresh
// request for that key.
const MAX_TRACKED_KEYS = 5000;

/**
 * Returns { allowed, remaining, retryAfterMs }. `key` should already
 * combine whatever identifies the caller (e.g. IP + email) so unrelated
 * callers don't share a bucket. Old timestamps outside the window are
 * pruned on every call, so memory doesn't grow for a key that stops being
 * used.
 */
/**
 * Best-effort caller IP for a rate-limit key. Trusts `x-forwarded-for`/
 * `x-real-ip` as set by the deployment's reverse proxy — fine for slowing
 * down casual abuse the way every rate limit in this app already does, not
 * meant to withstand a header-spoofing adversary bypassing a proxy that
 * would normally overwrite it. Shared here (rather than a fourth-plus copy
 * per route) since every rate-limited route needs the exact same value.
 */
export function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(key, { windowMs, max }) {
  const now = Date.now();
  const windowStart = now - windowMs;

  let timestamps = hits.get(key);
  timestamps = timestamps ? timestamps.filter((t) => t > windowStart) : [];

  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return { allowed: false, remaining: 0, retryAfterMs: timestamps[0] + windowMs - now };
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  if (hits.size > MAX_TRACKED_KEYS) {
    const oldestKey = hits.keys().next().value;
    hits.delete(oldestKey);
  }

  return { allowed: true, remaining: max - timestamps.length, retryAfterMs: 0 };
}
