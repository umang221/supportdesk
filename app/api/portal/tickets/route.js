import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/portal/current-customer";
import { validateCreatePortalTicketInput } from "@/server/validators/ticketValidators";
import { createTicketForCustomer } from "@/server/services/ticketService";
import { normalizeTicket } from "@/lib/api/ticket-adapter";
import { toErrorResponse } from "@/server/utils/http-error";
import { checkRateLimit } from "@/server/utils/rateLimit";

// Keyed by account id — bounds how many tickets a single customer account
// can create, to stop a compromised/malicious account from flooding the
// queue (and the ticket-created emails it triggers).
export const PORTAL_TICKET_CREATE_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 20 };

/** Customer-authenticated ticket creation — customer id always comes from the session, never the request body. */
export async function POST(request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { allowed, retryAfterMs } = checkRateLimit(`portal-ticket-create:${customer.id}`, PORTAL_TICKET_CREATE_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many tickets created. Please try again later.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const input = validateCreatePortalTicketInput(body);
    const ticket = await createTicketForCustomer(input, customer.id);
    return NextResponse.json({ ticket: normalizeTicket(ticket) }, { status: 201 });
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
