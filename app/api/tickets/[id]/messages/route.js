import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { validateCreateMessageInput } from "@/server/validators/messageValidators";
import { listMessagesForTicket, createMessage } from "@/server/services/messageService";
import { toErrorResponse } from "@/server/utils/http-error";

/**
 * Ticket visibility here matches GET /api/tickets/:id (any authenticated
 * agent/team_lead/admin) — there's no team-scoped ticket visibility
 * anywhere else in this app yet, so this doesn't introduce a new boundary.
 */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const messages = await listMessagesForTicket(id);
  if (messages === null) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
  return NextResponse.json({ messages });
}

/**
 * Posts a reply or internal note. The author is always the session user —
 * a client can never post as another user or as a customer through this
 * route (see messageService.createMessage's doc comment on authorModel).
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
    const input = validateCreateMessageInput(body, id);
    const message = await createMessage({
      ticketId: id,
      authorId: user.id,
      authorModel: "User",
      body: input.body,
      isInternal: input.isInternal,
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
