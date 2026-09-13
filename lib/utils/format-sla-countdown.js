import { SLA_STATES } from "@/lib/constants/sla-states";
import { formatDuration } from "./format-duration";

/**
 * Resolves a ticket's SLA state into the {variant, label} pair SlaIndicator
 * expects. Countdown text is derived from `dueAt` relative to `now`, so it
 * stays accurate as time passes rather than being baked into the mock data.
 *
 * `now` must be passed in explicitly (no `Date.now()` default) — see the
 * matching note in format-relative-time.js: a default evaluated independently
 * on the server and during client hydration produces different countdown
 * text and triggers a hydration mismatch.
 */
export function formatSlaCountdown(ticket, now) {
  const { slaState, dueAt } = ticket;

  if (slaState === SLA_STATES.PAUSED) {
    return { variant: SLA_STATES.PAUSED, label: "Paused" };
  }

  if (slaState === SLA_STATES.COMPLETED) {
    return { variant: SLA_STATES.COMPLETED, label: "Completed" };
  }

  if (!dueAt) {
    return { variant: slaState, label: "No due date" };
  }

  const remaining = new Date(dueAt).getTime() - now;

  if (slaState === SLA_STATES.BREACHED || remaining < 0) {
    return { variant: SLA_STATES.BREACHED, label: `${formatDuration(remaining)} overdue` };
  }

  return { variant: slaState, label: formatDuration(remaining) };
}
