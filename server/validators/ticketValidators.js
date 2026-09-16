import mongoose from "mongoose";
import { PRIORITIES } from "@/lib/constants/priorities";
import { STATUSES } from "@/lib/constants/statuses";
import { TICKET_CHANNELS } from "@/server/models/Ticket";
import { HttpError } from "@/server/utils/http-error";

const PRIORITY_VALUES = Object.values(PRIORITIES);
const STATUS_VALUES = Object.values(STATUSES);

// Fields a client may set through the generic update endpoint. Everything
// else on the Ticket model — customer (reference, set once at creation),
// ticketNumber/dueAt/slaState (server-generated/calculated), assignee
// (must go through the dedicated assign endpoint so the assignment
// authorization rules can't be bypassed), status (must go through the
// state-machine-guarded status endpoint), createdAt/updatedAt (audit) — is
// protected.
const UPDATABLE_FIELDS = ["subject", "team", "priority", "channel"];

function isValidObjectId(value) {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

/**
 * Validates POST /api/tickets input. Returns { subject, customer, team,
 * priority, channel } with defaults applied. Throws HttpError(400) with
 * fieldErrors on any problem — malformed body, missing required field, or
 * an id that isn't even a well-formed ObjectId (existence of the
 * referenced customer/team is checked by the service, not here).
 */
export function validateCreateTicketInput(data) {
  const errors = {};

  const subject = typeof data?.subject === "string" ? data.subject.trim() : "";
  if (!subject) errors.subject = "Subject is required.";
  else if (subject.length > 200) errors.subject = "Subject must be 200 characters or fewer.";

  if (!isValidObjectId(data?.customer)) errors.customer = "A valid customer id is required.";
  if (!isValidObjectId(data?.team)) errors.team = "A valid team id is required.";

  let priority = PRIORITIES.MEDIUM;
  if (data?.priority !== undefined) {
    if (!PRIORITY_VALUES.includes(data.priority)) {
      errors.priority = `Priority must be one of: ${PRIORITY_VALUES.join(", ")}.`;
    } else {
      priority = data.priority;
    }
  }

  let channel = "email";
  if (data?.channel !== undefined) {
    if (!TICKET_CHANNELS.includes(data.channel)) {
      errors.channel = `Channel must be one of: ${TICKET_CHANNELS.join(", ")}.`;
    } else {
      channel = data.channel;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Invalid ticket input.", { code: "validation_error", fieldErrors: errors });
  }

  return { subject, customer: data.customer, team: data.team, priority, channel };
}

const MAX_DESCRIPTION_LENGTH = 10000;

/**
 * Validates POST /api/portal/tickets input — deliberately separate from
 * validateCreateTicketInput since a customer never supplies customer/team
 * (both are derived server-side, see ticketService.createTicketForCustomer)
 * and does supply a `description`, which becomes the ticket's first message
 * rather than a Ticket field.
 */
export function validateCreatePortalTicketInput(data) {
  const errors = {};

  const subject = typeof data?.subject === "string" ? data.subject.trim() : "";
  if (!subject) errors.subject = "Subject is required.";
  else if (subject.length > 200) errors.subject = "Subject must be 200 characters or fewer.";

  const description = typeof data?.description === "string" ? data.description.trim() : "";
  if (!description) errors.description = "Description is required.";
  else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
  }

  let priority = PRIORITIES.MEDIUM;
  if (data?.priority !== undefined) {
    if (!PRIORITY_VALUES.includes(data.priority)) {
      errors.priority = `Priority must be one of: ${PRIORITY_VALUES.join(", ")}.`;
    } else {
      priority = data.priority;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Invalid ticket input.", { code: "validation_error", fieldErrors: errors });
  }

  return { subject, description, priority };
}

/**
 * Validates PATCH /api/tickets/:id input. Rejects the request outright if it
 * touches a protected field (rather than silently dropping it) so a client
 * never mistakenly believes a protected field changed. Returns a sanitized
 * patch containing only the allowed fields that were actually provided.
 */
export function validateUpdateTicketInput(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError(400, "Request body must be a JSON object.", { code: "validation_error" });
  }

  const disallowedFields = Object.keys(data).filter((key) => !UPDATABLE_FIELDS.includes(key));
  if (disallowedFields.length > 0) {
    throw new HttpError(400, `These fields cannot be changed through this endpoint: ${disallowedFields.join(", ")}.`, {
      code: "protected_field",
      fieldErrors: Object.fromEntries(disallowedFields.map((key) => [key, "This field cannot be updated here."])),
    });
  }

  const errors = {};
  const patch = {};

  if (data.subject !== undefined) {
    const subject = typeof data.subject === "string" ? data.subject.trim() : "";
    if (!subject) errors.subject = "Subject cannot be empty.";
    else if (subject.length > 200) errors.subject = "Subject must be 200 characters or fewer.";
    else patch.subject = subject;
  }

  if (data.team !== undefined) {
    if (!isValidObjectId(data.team)) errors.team = "A valid team id is required.";
    else patch.team = data.team;
  }

  if (data.priority !== undefined) {
    if (!PRIORITY_VALUES.includes(data.priority)) {
      errors.priority = `Priority must be one of: ${PRIORITY_VALUES.join(", ")}.`;
    } else {
      patch.priority = data.priority;
    }
  }

  if (data.channel !== undefined) {
    if (!TICKET_CHANNELS.includes(data.channel)) {
      errors.channel = `Channel must be one of: ${TICKET_CHANNELS.join(", ")}.`;
    } else {
      patch.channel = data.channel;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Invalid ticket input.", { code: "validation_error", fieldErrors: errors });
  }

  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, "No updatable fields provided.", { code: "validation_error" });
  }

  return patch;
}

/** Validates POST /api/tickets/:id/status input — shape only; the state
 * machine (server/services/ticketStateMachine.js) decides legality. */
export function validateStatusInput(data) {
  const status = data?.status;
  if (!STATUS_VALUES.includes(status)) {
    throw new HttpError(
      400,
      `Status must be one of: ${STATUS_VALUES.join(", ")}.`,
      { code: "validation_error", fieldErrors: { status: "Invalid status value." } }
    );
  }
  return status;
}

/**
 * Validates POST /api/tickets/:id/assign input. `assigneeId` must be either
 * a well-formed ObjectId (assign) or explicit `null` (unassign) — omitting
 * it entirely is rejected so a caller can't send an empty body by mistake
 * and have it silently do nothing.
 */
export function validateAssignInput(data) {
  const assigneeId = data?.assigneeId;
  if (assigneeId === null) return { assigneeId: null };
  if (isValidObjectId(assigneeId)) return { assigneeId };

  throw new HttpError(400, "assigneeId must be a valid user id, or null to unassign.", {
    code: "validation_error",
    fieldErrors: { assigneeId: "Must be a valid user id or null." },
  });
}

export { isValidObjectId };
