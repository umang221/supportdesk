import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getTicketById } from "@/server/services/ticketService";
import { listMessagesForTicket } from "@/server/services/messageService";
import { suggestReply } from "@/server/ai/aiService";
import { toErrorResponse } from "@/server/utils/http-error";

/** Returns a draft reply as text only — it is never posted as a message automatically. The agent reviews/edits it in the composer before sending (see TicketAiPanel's "Use as reply"). */
export async function POST(_request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await params;
    const ticket = await getTicketById(id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    const messages = (await listMessagesForTicket(id)) ?? [];

    const result = await suggestReply(ticket, messages);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
