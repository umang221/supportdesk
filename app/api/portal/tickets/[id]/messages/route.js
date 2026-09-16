import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/portal/current-customer";
import { getTicketForCustomer } from "@/server/services/ticketService";
import { listMessagesForCustomerTicket, createMessage } from "@/server/services/messageService";
import { validateCreateMessageInput } from "@/server/validators/messageValidators";
import { toErrorResponse } from "@/server/utils/http-error";
import { checkRateLimit } from "@/server/utils/rateLimit";

// Keyed by account id — bounds how many messages a single customer account
// can post across all of their tickets, to stop a compromised/malicious
// account from flooding the conversation thread (and the reply emails it
// triggers).
export const PORTAL_MESSAGE_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 20 };

/**
 * Customer-authenticated counterpart to app/api/tickets/[id]/messages.
 * Ownership is enforced by getTicketForCustomer (server/services/ticketService.js),
 * which returns null both for a nonexistent ticket and one owned by someone
 * else — mapped to 404 (never 403) here, matching the existing check in
 * app/portal/(app)/tickets/[id]/page.js, so this never confirms to a caller
 * that another customer's ticket id is valid.
 */
export async function GET(request, { params }) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const ticket = await getTicketForCustomer(id, customer.id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  // Internal notes are filtered out inside the service itself (see
  // listMessagesForCustomerTicket), not here — so this route can never leak
  // them even if this check were ever bypassed or copied elsewhere.
  const messages = await listMessagesForCustomerTicket(id);
  return NextResponse.json({ messages });
}

/**
 * Posts a customer reply. The author is always the session customer —
 * `isInternal` is never read from the request body, since a customer can
 * never create an internal note (that's an agent-only concept).
 */
export async function POST(request, { params }) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { allowed, retryAfterMs } = checkRateLimit(`portal-message:${customer.id}`, PORTAL_MESSAGE_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many messages sent. Please try again later.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const { id } = await params;
  const ticket = await getTicketForCustomer(id, customer.id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const input = validateCreateMessageInput(body, id);
    const message = await createMessage({
      ticketId: id,
      authorId: customer.id,
      authorModel: "Customer",
      body: input.body,
      isInternal: false,
      attachments: input.attachments,
    });
    if (!message) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
