import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/server/utils/rateLimit";

describe("rateLimit", () => {
  it("allows requests under the max within the window", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i += 1) {
      const result = checkRateLimit(key, { windowMs: 60_000, max: 3 });
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks once the max is reached within the window", () => {
    const key = `test:${Math.random()}`;
    checkRateLimit(key, { windowMs: 60_000, max: 2 });
    checkRateLimit(key, { windowMs: 60_000, max: 2 });
    const blocked = checkRateLimit(key, { windowMs: 60_000, max: 2 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("keeps separate buckets per key", () => {
    const keyA = `test:a:${Math.random()}`;
    const keyB = `test:b:${Math.random()}`;
    checkRateLimit(keyA, { windowMs: 60_000, max: 1 });
    const blockedA = checkRateLimit(keyA, { windowMs: 60_000, max: 1 });
    const allowedB = checkRateLimit(keyB, { windowMs: 60_000, max: 1 });
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });

  it("allows again once the window has passed", async () => {
    const key = `test:${Math.random()}`;
    checkRateLimit(key, { windowMs: 50, max: 1 });
    expect(checkRateLimit(key, { windowMs: 50, max: 1 }).allowed).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(checkRateLimit(key, { windowMs: 50, max: 1 }).allowed).toBe(true);
  });
});
