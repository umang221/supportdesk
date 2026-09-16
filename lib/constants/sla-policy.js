import { PRIORITIES } from "./priorities";

/**
 * Default SLA policy configuration, keyed by ticket priority — the
 * fallback/seed values `SLA_POLICY_BY_PRIORITY` below starts from.
 * `/admin/sla-policy` (server/services/slaPolicyService.js) lets an admin
 * edit the live policy from here on; this constant itself stays static so
 * there's always a known-good default to fall back to.
 *
 * Times are in minutes. `businessHours` from the spec (calendar-aware SLA
 * clocks) is intentionally not implemented — durations here are simple
 * wall-clock windows from ticket creation.
 */
export const DEFAULT_SLA_POLICY_BY_PRIORITY = {
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

/**
 * `SLA_POLICY_BY_PRIORITY` starts as a copy of the defaults above and can be
 * overridden at runtime by server/services/slaPolicyService.js once an admin
 * edits a policy (Task 18 — SLA policy management). It stays a plain
 * in-memory object — read synchronously by slaService's pure calculation
 * functions, exactly as before — rather than turning those into async DB
 * reads, which would ripple through every call site. This is safe for the
 * app's single-process architecture (same reasoning as server/jobs/jobRunner.js):
 * slaPolicyService persists the change to Mongo *and* updates this object in
 * the same request, so the running process picks it up immediately.
 */
export const SLA_POLICY_BY_PRIORITY = { ...DEFAULT_SLA_POLICY_BY_PRIORITY };

export function getSlaPolicy(priority) {
  return SLA_POLICY_BY_PRIORITY[priority] ?? SLA_POLICY_BY_PRIORITY[PRIORITIES.MEDIUM];
}

/** Applied by slaPolicyService after a successful DB write — see the comment above. */
export function setSlaPolicyOverride(priority, { firstResponseMinutes, resolutionMinutes }) {
  if (!SLA_POLICY_BY_PRIORITY[priority]) return;
  SLA_POLICY_BY_PRIORITY[priority] = { firstResponseMinutes, resolutionMinutes };
}
