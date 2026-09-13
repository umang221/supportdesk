import { PRIORITIES } from "./priorities";

/**
 * Static SLA policy configuration, keyed by ticket priority. Mirrors the
 * SLA POLICY entity described in the project spec (name/priority/
 * firstResponseTime/resolutionTime) but as a plain constants table rather
 * than a DB-backed collection — there is no admin UI to edit policies yet
 * (that's Phase 10), so a config table follows the same pattern already
 * used for PRIORITIES/STATUSES/SLA_STATES instead of introducing a new
 * Mongoose model with nothing to manage it.
 *
 * Times are in minutes. `businessHours` from the spec (calendar-aware SLA
 * clocks) is intentionally not implemented — durations here are simple
 * wall-clock windows from ticket creation.
 */
export const SLA_POLICY_BY_PRIORITY = {
  [PRIORITIES.URGENT]: { firstResponseMinutes: 60, resolutionMinutes: 4 * 60 },
  [PRIORITIES.HIGH]: { firstResponseMinutes: 4 * 60, resolutionMinutes: 8 * 60 },
  [PRIORITIES.MEDIUM]: { firstResponseMinutes: 8 * 60, resolutionMinutes: 24 * 60 },
  [PRIORITIES.LOW]: { firstResponseMinutes: 24 * 60, resolutionMinutes: 72 * 60 },
};

// Fraction of the resolution window remaining at which a ticket is
// considered "approaching" or "critical". Chosen so a ticket spends roughly
// the first half of its window healthy, the next 30% approaching, and the
// final 20% critical before breaching.
export const SLA_APPROACHING_RATIO = 0.5;
export const SLA_CRITICAL_RATIO = 0.2;

export function getSlaPolicy(priority) {
  return SLA_POLICY_BY_PRIORITY[priority] ?? SLA_POLICY_BY_PRIORITY[PRIORITIES.MEDIUM];
}
