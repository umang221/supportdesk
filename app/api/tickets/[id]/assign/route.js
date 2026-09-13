import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { validateAssignInput } from "@/server/validators/ticketValidators";
import { assignTicket } from "@/server/services/ticketService";
import { toErrorResponse } from "@/server/utils/http-error";

/**
 * Dedicated assignment endpoint — kept separate from the generic
 * PATCH /api/tickets/:id so `assignee` can never be set without going
 * through assignTicket's authorization rules (self-assign for agents,
 * assign-to-anyone/unassign for team leads and admins).
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
    const { assigneeId } = validateAssignInput(body);
    const ticket = await assignTicket(id, { assigneeId, actingUser: user });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    return NextResponse.json({ ticket });
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
