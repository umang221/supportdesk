import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getTicketById } from "@/server/services/ticketService";
import { listMessagesForTicket } from "@/server/services/messageService";
import { summarizeTicket } from "@/server/ai/aiService";
import { toErrorResponse } from "@/server/utils/http-error";

/** On-demand only — never called automatically on page load (see components/tickets/TicketAiPanel.jsx). */
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

    const result = await summarizeTicket(ticket, messages);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
