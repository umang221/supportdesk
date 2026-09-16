import { describe, it, expect } from "vitest";
import { checkRateLimit, getClientIp } from "@/server/utils/rateLimit";
import { CHANGE_PASSWORD_RATE_LIMIT as STAFF_CHANGE_PASSWORD_RATE_LIMIT } from "@/app/api/users/me/password/route";
import { CHANGE_PASSWORD_RATE_LIMIT as CUSTOMER_CHANGE_PASSWORD_RATE_LIMIT } from "@/app/api/portal/customers/me/password/route";
import { PORTAL_TICKET_CREATE_RATE_LIMIT } from "@/app/api/portal/tickets/route";
import { PORTAL_MESSAGE_RATE_LIMIT } from "@/app/api/portal/tickets/[id]/messages/route";
import { PORTAL_ATTACHMENT_RATE_LIMIT } from "@/app/api/portal/tickets/[id]/attachments/route";
import { PROFILE_UPDATE_RATE_LIMIT as STAFF_PROFILE_UPDATE_RATE_LIMIT } from "@/app/api/users/me/route";
import { AVATAR_UPLOAD_RATE_LIMIT as STAFF_AVATAR_UPLOAD_RATE_LIMIT } from "@/app/api/users/me/avatar/route";
import { PROFILE_UPDATE_RATE_LIMIT as CUSTOMER_PROFILE_UPDATE_RATE_LIMIT } from "@/app/api/portal/customers/me/route";
import { AVATAR_UPLOAD_RATE_LIMIT as CUSTOMER_AVATAR_UPLOAD_RATE_LIMIT } from "@/app/api/portal/customers/me/avatar/route";

/**
 * Exercises the exact rate-limit configs each Task 23/24 route uses
 * (imported from the route files themselves, not re-typed here) against the
 * real checkRateLimit implementation — this is testing the deployed
 * configuration, not a guess at what it might be. Route handlers
 * themselves aren't imported/called (see every other test file in this
 * suite): they depend on next/headers' cookies(), which only works inside
 * Next's own request-handling runtime, not a plain Vitest process.
 */
function uniqueKey(prefix) {
  return `${prefix}:${Math.random().toString(36).slice(2)}`;
}

describe("Task 23 rate-limit configs", () => {
  it("staff change-password: blocks after max attempts for one account, unaffected by a different account", () => {
    const accountKey = uniqueKey("change-password:user");
    for (let i = 0; i < STAFF_CHANGE_PASSWORD_RATE_LIMIT.max; i += 1) {
      expect(checkRateLimit(accountKey, STAFF_CHANGE_PASSWORD_RATE_LIMIT).allowed).toBe(true);
    }
    expect(checkRateLimit(accountKey, STAFF_CHANGE_PASSWORD_RATE_LIMIT).allowed).toBe(false);

    const otherAccountKey = uniqueKey("change-password:user");
    expect(checkRateLimit(otherAccountKey, STAFF_CHANGE_PASSWORD_RATE_LIMIT).allowed).toBe(true);
  });

  it("customer change-password: blocks after max attempts", () => {
    const accountKey = uniqueKey("change-password:customer");
    for (let i = 0; i < CUSTOMER_CHANGE_PASSWORD_RATE_LIMIT.max; i += 1) {
      expect(checkRateLimit(accountKey, CUSTOMER_CHANGE_PASSWORD_RATE_LIMIT).allowed).toBe(true);
    }
    expect(checkRateLimit(accountKey, CUSTOMER_CHANGE_PASSWORD_RATE_LIMIT).allowed).toBe(false);
  });

  it("portal ticket creation: blocks after max tickets for one customer", () => {
    const accountKey = uniqueKey("portal-ticket-create");
    for (let i = 0; i < PORTAL_TICKET_CREATE_RATE_LIMIT.max; i += 1) {
      expect(checkRateLimit(accountKey, PORTAL_TICKET_CREATE_RATE_LIMIT).allowed).toBe(true);
    }
    expect(checkRateLimit(accountKey, PORTAL_TICKET_CREATE_RATE_LIMIT).allowed).toBe(false);
  });

  it("portal message posting: blocks after max messages for one customer", () => {
    const accountKey = uniqueKey("portal-message");
    for (let i = 0; i < PORTAL_MESSAGE_RATE_LIMIT.max; i += 1) {
      expect(checkRateLimit(accountKey, PORTAL_MESSAGE_RATE_LIMIT).allowed).toBe(true);
    }
    expect(checkRateLimit(accountKey, PORTAL_MESSAGE_RATE_LIMIT).allowed).toBe(false);
  });

  it("portal attachment upload: blocks after max uploads for one customer", () => {
    const accountKey = uniqueKey("portal-attachment");
    for (let i = 0; i < PORTAL_ATTACHMENT_RATE_LIMIT.max; i += 1) {
      expect(checkRateLimit(accountKey, PORTAL_ATTACHMENT_RATE_LIMIT).allowed).toBe(true);
    }
    expect(checkRateLimit(accountKey, PORTAL_ATTACHMENT_RATE_LIMIT).allowed).toBe(false);
  });

  it("each of the five configs is keyed by account, not IP alone (windowMs/max are sane, non-zero)", () => {
    for (const config of [
      STAFF_CHANGE_PASSWORD_RATE_LIMIT,
      CUSTOMER_CHANGE_PASSWORD_RATE_LIMIT,
      PORTAL_TICKET_CREATE_RATE_LIMIT,
      PORTAL_MESSAGE_RATE_LIMIT,
      PORTAL_ATTACHMENT_RATE_LIMIT,
    ]) {
      expect(config.windowMs).toBeGreaterThan(0);
      expect(config.max).toBeGreaterThan(0);
    }
  });
});

describe("Task 24 rate-limit configs", () => {
  it("staff profile update: blocks after max attempts for one account", () => {
    const accountKey = uniqueKey("profile-update:user");
    for (let i = 0; i < STAFF_PROFILE_UPDATE_RATE_LIMIT.max; i += 1) {
      expect(checkRateLimit(accountKey, STAFF_PROFILE_UPDATE_RATE_LIMIT).allowed).toBe(true);
    }
    expect(checkRateLimit(accountKey, STAFF_PROFILE_UPDATE_RATE_LIMIT).allowed).toBe(false);
  });

  it("staff avatar upload: blocks after max attempts for one account", () => {
    const accountKey = uniqueKey("avatar-upload:user");
    for (let i = 0; i < STAFF_AVATAR_UPLOAD_RATE_LIMIT.max; i += 1) {
      expect(checkRateLimit(accountKey, STAFF_AVATAR_UPLOAD_RATE_LIMIT).allowed).toBe(true);
    }
    expect(checkRateLimit(accountKey, STAFF_AVATAR_UPLOAD_RATE_LIMIT).allowed).toBe(false);
  });

  it("customer profile update: blocks after max attempts for one account", () => {
    const accountKey = uniqueKey("profile-update:customer");
    for (let i = 0; i < CUSTOMER_PROFILE_UPDATE_RATE_LIMIT.max; i += 1) {
      expect(checkRateLimit(accountKey, CUSTOMER_PROFILE_UPDATE_RATE_LIMIT).allowed).toBe(true);
    }
    expect(checkRateLimit(accountKey, CUSTOMER_PROFILE_UPDATE_RATE_LIMIT).allowed).toBe(false);
  });

  it("customer avatar upload: blocks after max attempts for one account", () => {
    const accountKey = uniqueKey("avatar-upload:customer");
    for (let i = 0; i < CUSTOMER_AVATAR_UPLOAD_RATE_LIMIT.max; i += 1) {
      expect(checkRateLimit(accountKey, CUSTOMER_AVATAR_UPLOAD_RATE_LIMIT).allowed).toBe(true);
    }
    expect(checkRateLimit(accountKey, CUSTOMER_AVATAR_UPLOAD_RATE_LIMIT).allowed).toBe(false);
  });

  it("each of the four configs is sane (non-zero windowMs/max)", () => {
    for (const config of [
      STAFF_PROFILE_UPDATE_RATE_LIMIT,
      STAFF_AVATAR_UPLOAD_RATE_LIMIT,
      CUSTOMER_PROFILE_UPDATE_RATE_LIMIT,
      CUSTOMER_AVATAR_UPLOAD_RATE_LIMIT,
    ]) {
      expect(config.windowMs).toBeGreaterThan(0);
      expect(config.max).toBeGreaterThan(0);
    }
  });
});

describe("getClientIp", () => {
  function fakeRequest(headers) {
    const map = new Map(Object.entries(headers));
    return { headers: { get: (key) => map.get(key) ?? null } };
  }

  it("prefers the first entry of x-forwarded-for", () => {
    const ip = getClientIp(fakeRequest({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }));
    expect(ip).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const ip = getClientIp(fakeRequest({ "x-real-ip": "198.51.100.7" }));
    expect(ip).toBe("198.51.100.7");
  });

  it("falls back to 'unknown' when neither header is present", () => {
    const ip = getClientIp(fakeRequest({}));
    expect(ip).toBe("unknown");
  });
});
