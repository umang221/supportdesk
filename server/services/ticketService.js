import { connectDB } from "@/server/utils/db";
import Ticket from "@/server/models/Ticket";
import Customer from "@/server/models/Customer";
import Team from "@/server/models/Team";
import User from "@/server/models/User";
import { STATUSES } from "@/lib/constants/statuses";
import { PRIORITIES } from "@/lib/constants/priorities";
import { HttpError } from "@/server/utils/http-error";
import { hasRole } from "@/lib/auth/authorization";
import { assertValidStatusTransition } from "@/server/services/ticketStateMachine";
import { isValidObjectId } from "@/server/validators/ticketValidators";
import { computeInitialSla, recalcSlaOnPriorityChange, recalcSlaOnStatusChange, getLiveSlaState } from "@/server/services/slaService";
import { publish, REALTIME_EVENTS } from "@/server/realtime/eventBus";
import { sendTicketCreatedEmail, sendTicketResolvedEmail, sendTicketAssignedEmail } from "@/server/email/emailService";
import { createMessage } from "@/server/services/messageService";
import { createNotification } from "@/server/services/notificationService";

const TICKET_NUMBER_PREFIX = "TCK-";
const MAX_TICKET_NUMBER_ATTEMPTS = 5;

const LIST_FILTER_FIELDS = ["status", "priority", "team", "assignee", "customer"];
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function populateTicketRefs(query) {
  return query
    .populate("customer", "name email company avatarUrl")
    .populate("team", "name")
    .populate("assignee", "name email avatarUrl");
}

/**
 * Converts a Ticket document into the plain object returned to clients,
 * overlaying the live (recomputed, not persisted) SLA state — see
 * getLiveSlaState for why this isn't just read from the stored field.
 */
function presentTicket(ticketDoc, now = new Date()) {
  if (!ticketDoc) return null;
  const ticket = ticketDoc.toObject();
  ticket.slaState = getLiveSlaState(ticket, now);
  return ticket;
}

/** Lists tickets with optional exact-match filters and pagination. */
export async function listTickets(rawQuery = {}) {
  await connectDB();

  const filter = {};
  for (const field of LIST_FILTER_FIELDS) {
    const value = rawQuery[field];
    if (value === undefined || value === null || value === "") continue;

    if (field === "status" && !Object.values(STATUSES).includes(value)) {
      throw new HttpError(400, `Invalid status filter: ${value}.`, { code: "validation_error" });
    }
    if (field === "priority" && !Object.values(PRIORITIES).includes(value)) {
      throw new HttpError(400, `Invalid priority filter: ${value}.`, { code: "validation_error" });
    }
    if ((field === "team" || field === "assignee" || field === "customer") && !isValidObjectId(value)) {
      throw new HttpError(400, `Invalid ${field} filter: must be a valid id.`, { code: "validation_error" });
    }
    filter[field] = value;
  }

  const page = Math.max(1, Number.parseInt(rawQuery.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(rawQuery.limit, 10) || DEFAULT_PAGE_SIZE));

  const now = new Date();
  const [tickets, total] = await Promise.all([
    populateTicketRefs(Ticket.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit)),
    Ticket.countDocuments(filter),
  ]);

  return {
    tickets: tickets.map((ticket) => presentTicket(ticket, now)),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Fetches one ticket by id. Returns null if the id is malformed or not found. */
export async function getTicketById(id) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const ticket = await populateTicketRefs(Ticket.findById(id));
  return presentTicket(ticket);
}

/**
 * Fetches a ticket only if it belongs to the given customer — the shared
 * ownership check for every customer-facing ticket sub-resource (messages,
 * attachments), so it lives in one tested place instead of being
 * re-implemented per route. Returns null both when the ticket doesn't exist
 * and when it exists but belongs to someone else — deliberately
 * indistinguishable, so a caller maps both to a 404 without ever confirming
 * that another customer's ticket id is valid.
 */
export async function getTicketForCustomer(id, customerId) {
  const ticket = await getTicketById(id);
  if (!ticket) return null;
  const ownerId = ticket.customer?._id ?? ticket.customer;
  if (!ownerId || String(ownerId) !== String(customerId)) return null;
  return ticket;
}

async function generateTicketNumber() {
  const latest = await Ticket.findOne({ ticketNumber: new RegExp(`^${TICKET_NUMBER_PREFIX}\\d+$`) })
    .sort({ ticketNumber: -1 })
    .select("ticketNumber")
    .lean();

  const latestSeq = latest ? Number.parseInt(latest.ticketNumber.slice(TICKET_NUMBER_PREFIX.length), 10) : 1000;
  return `${TICKET_NUMBER_PREFIX}${latestSeq + 1}`;
}

/**
 * Creates a ticket. `customer`/`team` are validated for well-formedness by
 * the input validator already; here we additionally confirm they reference
 * documents that actually exist, since a syntactically valid ObjectId for a
 * deleted/nonexistent customer or team would otherwise create an orphaned
 * ticket. `status`/`slaState`/`assignee`/`ticketNumber` are never accepted
 * from the caller — they always take their model defaults or are generated
 * here, never from client input.
 */
export async function createTicket(input) {
  await connectDB();

  const [customerExists, teamExists] = await Promise.all([
    Customer.exists({ _id: input.customer }),
    Team.exists({ _id: input.team }),
  ]);
  if (!customerExists) {
    throw new HttpError(400, "Customer not found.", { code: "validation_error", fieldErrors: { customer: "No customer with this id exists." } });
  }
  if (!teamExists) {
    throw new HttpError(400, "Team not found.", { code: "validation_error", fieldErrors: { team: "No team with this id exists." } });
  }

  const createdAt = new Date();
  const { dueAt, slaState } = computeInitialSla(input.priority, createdAt);

  for (let attempt = 0; attempt < MAX_TICKET_NUMBER_ATTEMPTS; attempt += 1) {
    const ticketNumber = await generateTicketNumber();
    try {
      const ticket = await Ticket.create({
        ticketNumber,
        subject: input.subject,
        customer: input.customer,
        team: input.team,
        priority: input.priority,
        channel: input.channel,
        dueAt,
        slaState,
      });
      const created = presentTicket(await populateTicketRefs(Ticket.findById(ticket._id)));
      publish(REALTIME_EVENTS.TICKET_UPDATED, created);
      await sendTicketCreatedEmail(created);
      return created;
    } catch (error) {
      const isDuplicateTicketNumber = error?.code === 11000 && "ticketNumber" in (error?.keyPattern ?? {});
      if (!isDuplicateTicketNumber || attempt === MAX_TICKET_NUMBER_ATTEMPTS - 1) throw error;
      // Concurrent create raced us for the same number — retry with a fresh one.
    }
  }
  throw new HttpError(500, "Failed to allocate a ticket number.");
}

/** Applies a generic field patch (already restricted to safe fields by the validator). */
export async function updateTicket(id, patch) {
  if (!isValidObjectId(id)) return null;
  await connectDB();

  if (patch.team) {
    const teamExists = await Team.exists({ _id: patch.team });
    if (!teamExists) {
      throw new HttpError(400, "Team not found.", { code: "validation_error", fieldErrors: { team: "No team with this id exists." } });
    }
  }

  const update = { ...patch };
  if (patch.priority) {
    const existing = await Ticket.findById(id).select("createdAt priority");
    if (!existing) return null;
    const { dueAt, slaState } = recalcSlaOnPriorityChange(existing, patch.priority);
    update.dueAt = dueAt;
    update.slaState = slaState;
  }

  const ticket = await populateTicketRefs(
    Ticket.findByIdAndUpdate(id, { $set: update }, { returnDocument: "after", runValidators: true })
  );
  const updated = presentTicket(ticket);
  if (updated) publish(REALTIME_EVENTS.TICKET_UPDATED, updated);
  return updated;
}

/**
 * Transitions a ticket's status, enforcing the centralized state machine.
 * Throws HttpError(409) for an illegal transition and returns null if the
 * ticket doesn't exist (the route handler maps that to 404).
 */
export async function transitionTicketStatus(id, nextStatus) {
  if (!isValidObjectId(id)) return null;
  await connectDB();

  const ticket = await Ticket.findById(id);
  if (!ticket) return null;

  assertValidStatusTransition(ticket.status, nextStatus);

  const now = new Date();
  const { slaState } = recalcSlaOnStatusChange(ticket, nextStatus, now);
  ticket.status = nextStatus;
  ticket.slaState = slaState;
  if (nextStatus === STATUSES.RESOLVED) {
    ticket.resolvedAt = now;
  }
  await ticket.save();
  const updated = presentTicket(await populateTicketRefs(Ticket.findById(ticket._id)), now);
  publish(REALTIME_EVENTS.TICKET_UPDATED, updated);
  if (nextStatus === STATUSES.RESOLVED) {
    await sendTicketResolvedEmail(updated);
  }
  return updated;
}

/**
 * Assigns (or unassigns, when assigneeId is null) a ticket to a user.
 * Authorization is enforced here (not just in the route) so the rule can
 * never be bypassed by another caller: team leads/admins may assign to
 * anyone, agents may only assign a ticket to themselves and may not
 * unassign. Returns null if the ticket doesn't exist.
 *
 * A notification + email are sent to the new assignee only when the
 * assignee actually changes (comparing against the ticket's previous
 * assignee) — reassigning a ticket to the agent who already holds it is a
 * no-op for notification purposes, matching the SLA job's transition-only
 * notification pattern (slaMonitorJob.js). Both are best-effort: a
 * notification/email failure must never fail the assignment itself
 * (createNotification doesn't swallow errors the way email does, so it's
 * intentionally sent after the ticket write and its own realtime publish,
 * with sendTicketAssignedEmail — internally fail-safe via emailProvider's
 * safeSend — sent last).
 */
export async function assignTicket(id, { assigneeId, actingUser }) {
  if (!isValidObjectId(id)) return null;
  await connectDB();

  const ticket = await Ticket.findById(id);
  if (!ticket) return null;

  const isPrivileged = hasRole(actingUser, ["team_lead", "admin"]);
  const previousAssigneeId = ticket.assignee ? String(ticket.assignee) : null;

  if (assigneeId === null) {
    if (!isPrivileged) {
      throw new HttpError(403, "Only a team lead or admin can unassign a ticket.", { code: "forbidden" });
    }
  } else {
    const isSelfAssign = String(assigneeId) === String(actingUser.id);
    if (!isPrivileged && !isSelfAssign) {
      throw new HttpError(403, "Agents may only assign tickets to themselves.", { code: "forbidden" });
    }

    const assignee = await User.findById(assigneeId).select("isActive");
    if (!assignee || !assignee.isActive) {
      throw new HttpError(400, "Assignee not found or inactive.", {
        code: "validation_error",
        fieldErrors: { assigneeId: "Must reference an active user." },
      });
    }
  }

  ticket.assignee = assigneeId;
  await ticket.save();
  const updated = presentTicket(await populateTicketRefs(Ticket.findById(ticket._id)));
  publish(REALTIME_EVENTS.TICKET_UPDATED, updated);

  const assigneeChanged = assigneeId !== null && String(assigneeId) !== previousAssigneeId;
  if (assigneeChanged) {
    await createNotification({
      type: "ticket_assigned",
      message: `You've been assigned to ${updated.ticketNumber}: "${updated.subject}"`,
      recipient: assigneeId,
      relatedTicket: updated._id,
    });
    await sendTicketAssignedEmail(updated);
  }

  return updated;
}

/**
 * Creates a ticket on behalf of a signed-in customer (see
 * app/api/portal/tickets/route.js — `customerId` is always the session
 * customer, never client-supplied) and seeds it with their description as
 * the first message, exactly like an agent-created ticket would get its
 * first customer_reply. Customers don't choose a team (that's an internal
 * routing detail), so this assigns the first team alphabetically as an
 * inbound triage queue — an admin/team lead can reassign from there the
 * same way they would any other unsorted ticket.
 */
export async function createTicketForCustomer({ subject, description, priority }, customerId) {
  await connectDB();

  const team = await Team.findOne().sort({ name: 1 });
  if (!team) {
    throw new HttpError(500, "No team is configured to receive new tickets yet.");
  }

  const ticket = await createTicket({
    subject,
    customer: customerId,
    team: team._id.toString(),
    priority,
    channel: "portal",
  });

  await createMessage({
    ticketId: ticket._id.toString(),
    authorId: customerId,
    authorModel: "Customer",
    body: description,
  });

  return ticket;
}
