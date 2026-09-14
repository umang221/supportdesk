import { describe, it, expect } from "vitest";
import { STATUSES } from "@/lib/constants/statuses";
import {
  isValidStatusTransition,
  assertValidStatusTransition,
  getAllowedNextStatuses,
} from "@/server/services/ticketStateMachine";

describe("ticketStateMachine", () => {
  it("allows free movement between the active work states", () => {
    expect(isValidStatusTransition(STATUSES.OPEN, STATUSES.PENDING)).toBe(true);
    expect(isValidStatusTransition(STATUSES.PENDING, STATUSES.ON_HOLD)).toBe(true);
    expect(isValidStatusTransition(STATUSES.ON_HOLD, STATUSES.OPEN)).toBe(true);
  });

  it("allows any active state to move forward to resolved or closed", () => {
    expect(isValidStatusTransition(STATUSES.OPEN, STATUSES.RESOLVED)).toBe(true);
    expect(isValidStatusTransition(STATUSES.PENDING, STATUSES.CLOSED)).toBe(true);
    expect(isValidStatusTransition(STATUSES.ON_HOLD, STATUSES.RESOLVED)).toBe(true);
  });

  it("only allows resolved/closed to reopen to open, never sideways", () => {
    expect(isValidStatusTransition(STATUSES.RESOLVED, STATUSES.OPEN)).toBe(true);
    expect(isValidStatusTransition(STATUSES.CLOSED, STATUSES.OPEN)).toBe(true);
    expect(isValidStatusTransition(STATUSES.RESOLVED, STATUSES.PENDING)).toBe(false);
    expect(isValidStatusTransition(STATUSES.CLOSED, STATUSES.ON_HOLD)).toBe(false);
    expect(isValidStatusTransition(STATUSES.RESOLVED, STATUSES.CLOSED)).toBe(true);
  });

  it("rejects a no-op transition to the same status", () => {
    expect(isValidStatusTransition(STATUSES.OPEN, STATUSES.OPEN)).toBe(false);
  });

  it("assertValidStatusTransition throws HttpError(409) for an illegal transition", () => {
    expect(() => assertValidStatusTransition(STATUSES.CLOSED, STATUSES.PENDING)).toThrowError(
      /Cannot transition ticket status/
    );
    try {
      assertValidStatusTransition(STATUSES.CLOSED, STATUSES.PENDING);
      throw new Error("expected assertValidStatusTransition to throw");
    } catch (error) {
      expect(error.status).toBe(409);
      expect(error.code).toBe("invalid_status_transition");
    }
  });

  it("getAllowedNextStatuses returns [] for an unknown status", () => {
    expect(getAllowedNextStatuses("not-a-real-status")).toEqual([]);
  });
});
