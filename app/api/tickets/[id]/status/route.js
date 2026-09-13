import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { validateStatusInput } from "@/server/validators/ticketValidators";
import { transitionTicketStatus } from "@/server/services/ticketService";
import { toErrorResponse } from "@/server/utils/http-error";

/**
 * Dedicated status-transition endpoint — the only way a ticket's status may
 * change. Kept separate from the generic PATCH /api/tickets/:id so that
 * every status change is forced through the state machine in
 * server/services/ticketStateMachine.js.
 */
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const nextStatus = validateStatusInput(body);
    const ticket = await transitionTicketStatus(id, nextStatus);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    return NextResponse.json({ ticket });
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
