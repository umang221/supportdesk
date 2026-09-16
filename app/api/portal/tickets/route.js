import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/portal/current-customer";
import { validateCreatePortalTicketInput } from "@/server/validators/ticketValidators";
import { createTicketForCustomer } from "@/server/services/ticketService";
import { normalizeTicket } from "@/lib/api/ticket-adapter";
import { toErrorResponse } from "@/server/utils/http-error";

/** Customer-authenticated ticket creation — customer id always comes from the session, never the request body. */
export async function POST(request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
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
