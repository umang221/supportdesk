import { connectDB } from "@/server/utils/db";
import Ticket from "@/server/models/Ticket";
import Customer from "@/server/models/Customer";
import Team from "@/server/models/Team";
import { STATUSES } from "@/lib/constants/statuses";
import { PRIORITIES } from "@/lib/constants/priorities";
import { HttpError } from "@/server/utils/http-error";
import { assertValidStatusTransition } from "@/server/services/ticketStateMachine";
import { isValidObjectId } from "@/server/validators/ticketValidators";

const TICKET_NUMBER_PREFIX = "TCK-";
const MAX_TICKET_NUMBER_ATTEMPTS = 5;

const LIST_FILTER_FIELDS = ["status", "priority", "team", "assignee", "customer"];
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function populateTicketRefs(query) {
  return query
    .populate("customer", "name email company")
    .populate("team", "name")
    .populate("assignee", "name email");
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

  const [tickets, total] = await Promise.all([
    populateTicketRefs(Ticket.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit)),
    Ticket.countDocuments(filter),
  ]);

  return { tickets, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Fetches one ticket by id. Returns null if the id is malformed or not found. */
export async function getTicketById(id) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  return populateTicketRefs(Ticket.findById(id));
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
      });
      return populateTicketRefs(Ticket.findById(ticket._id));
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

  const ticket = await populateTicketRefs(
    Ticket.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true })
  );
  return ticket;
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

  ticket.status = nextStatus;
  await ticket.save();
  return populateTicketRefs(Ticket.findById(ticket._id));
}
