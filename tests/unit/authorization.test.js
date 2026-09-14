import { describe, it, expect } from "vitest";
import { hasRole, assertApiRole } from "@/lib/auth/authorization";

describe("authorization", () => {
  describe("hasRole", () => {
    it("is false for a null user (signed out)", () => {
      expect(hasRole(null, ["admin"])).toBe(false);
    });

    it("is true when the user's role is in the allowlist", () => {
      expect(hasRole({ role: "admin" }, ["admin", "team_lead"])).toBe(true);
    });

    it("is false when the user's role is not in the allowlist", () => {
      expect(hasRole({ role: "agent" }, ["admin", "team_lead"])).toBe(false);
    });
  });

  describe("assertApiRole", () => {
    it("throws a 401 HttpError for a signed-out user", () => {
      try {
        assertApiRole(null, ["admin"]);
        throw new Error("expected assertApiRole to throw");
      } catch (error) {
        expect(error.status).toBe(401);
        expect(error.code).toBe("unauthenticated");
      }
    });

    it("throws a 403 HttpError for a signed-in user without the required role", () => {
      try {
        assertApiRole({ role: "agent" }, ["admin"]);
        throw new Error("expected assertApiRole to throw");
      } catch (error) {
        expect(error.status).toBe(403);
        expect(error.code).toBe("forbidden");
      }
    });

    it("does not throw for a signed-in user with the required role", () => {
      expect(() => assertApiRole({ role: "admin" }, ["admin"])).not.toThrow();
    });
  });
});
