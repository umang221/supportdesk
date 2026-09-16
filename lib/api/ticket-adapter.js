/**
 * Adapts the JSON shape returned by the ticket/user API routes (Mongo `_id`,
 * populated reference documents) into the flat view-model shape the ticket
 * UI components already expect. Kept framework-agnostic (no "use client")
 * so it can run in both Server Components (portal pages) and client
 * components (AgentWorkspace).
 */

// Called from Server Components (ticketService results carry real BSON
// ObjectId instances) as well as after a JSON round-trip through the API
// routes (ids already plain strings there) — normalize both to a string so
// id equality checks (e.g. the portal's own-ticket check) work either way.
function idToString(value) {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : value.toString();
}

function normalizeRef(ref, fields) {
  if (!ref || typeof ref !== "object") return null;
  const normalized = { id: idToString(ref._id) };
  for (const field of fields) normalized[field] = ref[field];
  return normalized;
}

export function normalizeTicket(ticket) {
  if (!ticket) return null;

  const customer = normalizeRef(ticket.customer, ["name", "email", "company", "phone", "plan"]);
  const team = normalizeRef(ticket.team, ["name"]);
  const assignee = normalizeRef(ticket.assignee, ["name", "email"]);

  return {
    id: idToString(ticket._id),
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    priority: ticket.priority,
    status: ticket.status,
    slaState: ticket.slaState,
    channel: ticket.channel,
    dueAt: ticket.dueAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    customerId: customer?.id ?? idToString(ticket.customer),
    teamId: team?.id ?? idToString(ticket.team),
    assigneeId: assignee?.id ?? idToString(ticket.assignee),
    customer,
    team,
    assignee,
  };
}

/**
 * Adapts a real Message API document into the shape TicketConversation
 * already expects (see components/tickets/TicketConversation.jsx), which
 * was designed around the mock message fixtures. `authorType` is derived
 * from `authorModel` (set server-side from the session, never from client
 * input — see messageService.createMessage) rather than assumed, since both
 * agent- and customer-authored messages come through this adapter now.
 */
export function normalizeMessage(message) {
  if (!message) return null;
  const authorType = message.authorModel === "Customer" ? "customer" : "agent";
  return {
    id: idToString(message._id),
    authorType,
    authorName: message.author?.name ?? (authorType === "customer" ? "Customer" : "Agent"),
    body: message.body,
    isInternal: message.type === "internal_note",
    attachments: message.attachments ?? [],
    createdAt: message.createdAt,
  };
}

export function normalizeUser(user) {
  if (!user) return null;
  return {
    id: idToString(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team ?? null,
  };
}
