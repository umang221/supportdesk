import { describe, it, expect } from "vitest";
import { PRIORITIES } from "@/lib/constants/priorities";
import { STATUSES } from "@/lib/constants/statuses";
import { SLA_STATES } from "@/lib/constants/sla-states";
import {
  calculateDueAt,
  deriveActiveSlaState,
  computeInitialSla,
  recalcSlaOnPriorityChange,
  recalcSlaOnStatusChange,
  getLiveSlaState,
} from "@/server/services/slaService";

const HOUR_MS = 60 * 60 * 1000;

describe("slaService", () => {
  it("calculateDueAt adds the priority's resolution window to the start time", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    // urgent = 4h resolution window (lib/constants/sla-policy.js defaults)
    const dueAt = calculateDueAt(PRIORITIES.URGENT, from);
    expect(dueAt.getTime() - from.getTime()).toBe(4 * HOUR_MS);
  });

  it("deriveActiveSlaState reports healthy well before the deadline", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const dueAt = new Date(now.getTime() + 4 * HOUR_MS); // full urgent window remaining
    expect(deriveActiveSlaState(PRIORITIES.URGENT, dueAt, now)).toBe(SLA_STATES.HEALTHY);
  });

  it("deriveActiveSlaState reports approaching inside the approaching ratio", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    // 40% of the 4h urgent window remaining (<=0.5 approaching threshold, >0.2 critical threshold)
    const dueAt = new Date(now.getTime() + 4 * HOUR_MS * 0.4);
    expect(deriveActiveSlaState(PRIORITIES.URGENT, dueAt, now)).toBe(SLA_STATES.APPROACHING);
  });

  it("deriveActiveSlaState reports critical just before the deadline", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const dueAt = new Date(now.getTime() + 4 * HOUR_MS * 0.1); // 10% remaining
    expect(deriveActiveSlaState(PRIORITIES.URGENT, dueAt, now)).toBe(SLA_STATES.CRITICAL);
  });

  it("deriveActiveSlaState reports breached once the deadline has passed", () => {
    const now = new Date("2026-01-01T04:00:00.000Z");
    const dueAt = new Date("2026-01-01T00:00:00.000Z");
    expect(deriveActiveSlaState(PRIORITIES.URGENT, dueAt, now)).toBe(SLA_STATES.BREACHED);
  });

  it("deriveActiveSlaState is healthy when there is no dueAt at all", () => {
    expect(deriveActiveSlaState(PRIORITIES.URGENT, null)).toBe(SLA_STATES.HEALTHY);
  });

  it("computeInitialSla sets dueAt from createdAt and starts healthy", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const { dueAt, slaState } = computeInitialSla(PRIORITIES.LOW, createdAt);
    expect(dueAt.getTime() - createdAt.getTime()).toBe(72 * HOUR_MS);
    expect(slaState).toBe(SLA_STATES.HEALTHY);
  });

  it("recalcSlaOnPriorityChange keeps the original createdAt as the clock start", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const ticket = { createdAt, priority: PRIORITIES.LOW };
    const { dueAt } = recalcSlaOnPriorityChange(ticket, PRIORITIES.URGENT, createdAt);
    expect(dueAt.getTime() - createdAt.getTime()).toBe(4 * HOUR_MS);
  });

  it("recalcSlaOnStatusChange pauses the clock on hold", () => {
    const ticket = { priority: PRIORITIES.HIGH, dueAt: new Date() };
    const { slaState } = recalcSlaOnStatusChange(ticket, STATUSES.ON_HOLD);
    expect(slaState).toBe(SLA_STATES.PAUSED);
  });

  it("recalcSlaOnStatusChange marks resolved-on-time as completed", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const ticket = { dueAt: new Date(now.getTime() + HOUR_MS) };
    const { slaState } = recalcSlaOnStatusChange(ticket, STATUSES.RESOLVED, now);
    expect(slaState).toBe(SLA_STATES.COMPLETED);
  });

  it("recalcSlaOnStatusChange marks resolved-after-deadline as breached", () => {
    const now = new Date("2026-01-01T02:00:00.000Z");
    const ticket = { dueAt: new Date("2026-01-01T00:00:00.000Z") };
    const { slaState } = recalcSlaOnStatusChange(ticket, STATUSES.RESOLVED, now);
    expect(slaState).toBe(SLA_STATES.BREACHED);
  });

  it("recalcSlaOnStatusChange resumes live calculation when reopened to open/pending", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const ticket = { priority: PRIORITIES.URGENT, dueAt: new Date(now.getTime() + 4 * HOUR_MS) };
    const { slaState } = recalcSlaOnStatusChange(ticket, STATUSES.OPEN, now);
    expect(slaState).toBe(SLA_STATES.HEALTHY);
  });

  it("getLiveSlaState keeps paused/completed as stored rather than recomputing from dueAt", () => {
    const pastDueTicket = { slaState: SLA_STATES.PAUSED, priority: PRIORITIES.URGENT, dueAt: new Date(0) };
    expect(getLiveSlaState(pastDueTicket)).toBe(SLA_STATES.PAUSED);

    const completedTicket = { slaState: SLA_STATES.COMPLETED, priority: PRIORITIES.URGENT, dueAt: new Date(0) };
    expect(getLiveSlaState(completedTicket)).toBe(SLA_STATES.COMPLETED);
  });

  it("getLiveSlaState recomputes live for active tickets instead of trusting a stale stored state", () => {
    const now = new Date("2026-01-01T04:00:00.000Z");
    const staleTicket = { slaState: SLA_STATES.HEALTHY, priority: PRIORITIES.URGENT, dueAt: new Date("2026-01-01T00:00:00.000Z") };
    expect(getLiveSlaState(staleTicket, now)).toBe(SLA_STATES.BREACHED);
  });
});
