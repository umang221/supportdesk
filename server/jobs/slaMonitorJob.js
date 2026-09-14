import { connectDB } from "@/server/utils/db";
import Ticket from "@/server/models/Ticket";
import { STATUSES } from "@/lib/constants/statuses";
import { SLA_STATES } from "@/lib/constants/sla-states";
import { deriveActiveSlaState } from "@/server/services/slaService";
import { getTicketById } from "@/server/services/ticketService";
import { createNotification } from "@/server/services/notificationService";
import { publish, REALTIME_EVENTS } from "@/server/realtime/eventBus";

// Tickets whose SLA countdown is actively running. on_hold/resolved/closed
// tickets carry a "paused"/"completed" slaState instead (see
// slaService.recalcSlaOnStatusChange) and are excluded by the slaState
// filter below too, but filtering on status here as well keeps this query
// correct even if that invariant were ever violated by a bug elsewhere.
const ACTIVE_STATUSES = [STATUSES.OPEN, STATUSES.PENDING];

const SLA_EVENT_MESSAGE = {
  [SLA_STATES.APPROACHING]: (ticket) => `${ticket.ticketNumber} is approaching its SLA deadline.`,
  [SLA_STATES.CRITICAL]: (ticket) => `${ticket.ticketNumber} is close to breaching its SLA deadline.`,
  [SLA_STATES.BREACHED]: (ticket) => `${ticket.ticketNumber} has breached its SLA.`,
};

const SLA_NOTIFICATION_TYPE = {
  [SLA_STATES.APPROACHING]: "sla_approaching",
  [SLA_STATES.CRITICAL]: "sla_critical",
  [SLA_STATES.BREACHED]: "sla_breached",
};

/**
 * Sweeps every actively-tracked ticket, recomputes its live SLA state via
 * the centralized slaService calculation, and persists a change when the
 * stored slaState has gone stale. This fills the gap slaService.
 * getLiveSlaState's doc comment calls out: without a job like this, a
 * ticket nobody touches keeps its slaState frozen at whatever it was on
 * last write, and every read has to recompute it on the fly to show the
 * truth. Reads still overlay the live value (harmless, now usually a
 * no-op) — this job just keeps the persisted value from drifting far behind.
 *
 * Idempotent by construction, not by a separate dedupe table: a
 * notification is only created on the *transition* into approaching/
 * critical/breached (freshly computed state !== the state already stored),
 * which this same write makes stick — so a second run, or a concurrent one,
 * sees the now-current stored state, finds no further transition, and
 * creates nothing. The job runner's overlap guard (jobRunner.js) also
 * prevents two sweeps from ever running at once.
 */
export async function runSlaMonitorSweep() {
  await connectDB();

  const tickets = await Ticket.find({
    status: { $in: ACTIVE_STATUSES },
    slaState: { $nin: [SLA_STATES.PAUSED, SLA_STATES.COMPLETED] },
  }).select("ticketNumber priority dueAt slaState assignee status");

  const now = new Date();
  let checked = 0;
  let updated = 0;
  let notified = 0;

  for (const ticket of tickets) {
    checked += 1;

    const liveState = deriveActiveSlaState(ticket.priority, ticket.dueAt, now);
    if (liveState === ticket.slaState) continue;

    ticket.slaState = liveState;
    await ticket.save();
    updated += 1;

    // Reuses ticketService's existing populate/present logic rather than
    // duplicating it here, so the realtime payload matches what every other
    // ticket mutation already broadcasts.
    const presented = await getTicketById(ticket._id.toString());
    publish(REALTIME_EVENTS.TICKET_UPDATED, presented);

    const notificationType = SLA_NOTIFICATION_TYPE[liveState];
    if (notificationType && ticket.assignee) {
      await createNotification({
        type: notificationType,
        message: SLA_EVENT_MESSAGE[liveState](ticket),
        recipient: ticket.assignee,
        relatedTicket: ticket._id,
      });
      notified += 1;
    }
    // Tickets with no assignee yet have no natural single recipient for an
    // SLA notification (no per-team broadcast exists) — the slaState is
    // still updated and broadcast above, just without a notification.
  }

  return { checked, updated, notified, ranAt: now };
}
