import { STATUSES } from "@/lib/constants/statuses";
import { SLA_STATES } from "@/lib/constants/sla-states";
import { SLA_APPROACHING_RATIO, SLA_CRITICAL_RATIO, getSlaPolicy } from "@/lib/constants/sla-policy";

/**
 * Pure SLA calculation utilities — no DB access here, so these are easy to
 * reason about and reuse from any service that mutates a ticket. Callers
 * (ticketService) are responsible for persisting the returned values.
 */

export function calculateDueAt(priority, from = new Date()) {
  const { resolutionMinutes } = getSlaPolicy(priority);
  return new Date(from.getTime() + resolutionMinutes * 60_000);
}

/** SLA state for a ticket that is actively being worked (not paused/completed), purely from time remaining until dueAt. */
export function deriveActiveSlaState(priority, dueAt, now = new Date()) {
  if (!dueAt) return SLA_STATES.HEALTHY;

  const remainingMs = new Date(dueAt).getTime() - now.getTime();
  if (remainingMs <= 0) return SLA_STATES.BREACHED;

  const { resolutionMinutes } = getSlaPolicy(priority);
  const windowMs = resolutionMinutes * 60_000;
  const ratio = remainingMs / windowMs;

  if (ratio <= SLA_CRITICAL_RATIO) return SLA_STATES.CRITICAL;
  if (ratio <= SLA_APPROACHING_RATIO) return SLA_STATES.APPROACHING;
  return SLA_STATES.HEALTHY;
}

/** {dueAt, slaState} for a brand-new ticket, with the SLA clock starting at createdAt. */
export function computeInitialSla(priority, createdAt = new Date()) {
  const dueAt = calculateDueAt(priority, createdAt);
  return { dueAt, slaState: deriveActiveSlaState(priority, dueAt, createdAt) };
}

/**
 * Recomputes dueAt/slaState after a priority change. The SLA clock still
 * starts at the ticket's original createdAt — changing priority tightens or
 * relaxes the deadline, it doesn't restart the clock.
 */
export function recalcSlaOnPriorityChange(ticket, newPriority, now = new Date()) {
  const dueAt = calculateDueAt(newPriority, ticket.createdAt);
  return { dueAt, slaState: deriveActiveSlaState(newPriority, dueAt, now) };
}

/**
 * Recomputes slaState (never dueAt) after a status transition:
 * - Moving to on_hold pauses the SLA clock (slaState becomes "paused").
 * - Moving to resolved/closed completes it: "completed" if that happened at
 *   or before dueAt, "breached" if it happened after.
 * - Moving to open/pending (including resuming from on_hold, or reopening
 *   from resolved/closed) resumes normal time-remaining calculation.
 */
export function recalcSlaOnStatusChange(ticket, nextStatus, now = new Date()) {
  if (nextStatus === STATUSES.ON_HOLD) {
    return { slaState: SLA_STATES.PAUSED };
  }

  if (nextStatus === STATUSES.RESOLVED || nextStatus === STATUSES.CLOSED) {
    const withinSla = !ticket.dueAt || now.getTime() <= new Date(ticket.dueAt).getTime();
    return { slaState: withinSla ? SLA_STATES.COMPLETED : SLA_STATES.BREACHED };
  }

  return { slaState: deriveActiveSlaState(ticket.priority, ticket.dueAt, now) };
}

/**
 * The SLA state to display for a ticket right now, without persisting it.
 * There is no background job to keep an idle ticket's stored slaState fresh
 * (out of scope for this task), so every read recomputes it on the fly for
 * active tickets; paused/completed tickets aren't governed by the countdown
 * and keep their stored state as-is.
 */
export function getLiveSlaState(ticket, now = new Date()) {
  if (ticket.slaState === SLA_STATES.PAUSED || ticket.slaState === SLA_STATES.COMPLETED) {
    return ticket.slaState;
  }
  return deriveActiveSlaState(ticket.priority, ticket.dueAt, now);
}
