import { STATUSES } from "@/lib/constants/statuses";
import { HttpError } from "@/server/utils/http-error";

/**
 * Centralized ticket status state machine. This is the single source of
 * truth for which status transitions are legal — both the status route
 * handler and (later) any other code that changes status must go through
 * assertValidStatusTransition rather than writing `status` directly, so a
 * transition can never bypass these rules.
 *
 * Rules (preserving the 5 existing statuses and their meanings):
 * - open/pending/on_hold are the "active work" states and can move freely
 *   between each other, or forward to resolved/closed.
 * - resolved/closed can only be reopened to "open" (e.g. the customer
 *   replies again) — they cannot jump sideways to pending/on_hold directly,
 *   since those are mid-work states that only make sense once work has
 *   resumed via a reopen.
 * - A status "transitioning" to itself is not a transition and is rejected;
 *   callers with a no-op update should skip calling this.
 */
const TICKET_STATUS_TRANSITIONS = {
  [STATUSES.OPEN]: [STATUSES.PENDING, STATUSES.ON_HOLD, STATUSES.RESOLVED, STATUSES.CLOSED],
  [STATUSES.PENDING]: [STATUSES.OPEN, STATUSES.ON_HOLD, STATUSES.RESOLVED, STATUSES.CLOSED],
  [STATUSES.ON_HOLD]: [STATUSES.OPEN, STATUSES.PENDING, STATUSES.RESOLVED, STATUSES.CLOSED],
  [STATUSES.RESOLVED]: [STATUSES.OPEN, STATUSES.CLOSED],
  [STATUSES.CLOSED]: [STATUSES.OPEN],
};

export function getAllowedNextStatuses(currentStatus) {
  return TICKET_STATUS_TRANSITIONS[currentStatus] ?? [];
}

export function isValidStatusTransition(currentStatus, nextStatus) {
  return getAllowedNextStatuses(currentStatus).includes(nextStatus);
}

/** Throws an HttpError(409) if the transition isn't allowed from currentStatus. */
export function assertValidStatusTransition(currentStatus, nextStatus) {
  if (!isValidStatusTransition(currentStatus, nextStatus)) {
    throw new HttpError(409, `Cannot transition ticket status from "${currentStatus}" to "${nextStatus}".`, {
      code: "invalid_status_transition",
    });
  }
}
