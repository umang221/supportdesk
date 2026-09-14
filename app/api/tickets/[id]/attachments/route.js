import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getTicketById } from "@/server/services/ticketService";
import { uploadTicketAttachment } from "@/server/attachments/attachmentService";
import { toErrorResponse } from "@/server/utils/http-error";

/**
 * Uploads one file for later attaching to a message on this ticket (see
 * POST /api/tickets/:id/messages, which takes this endpoint's response
 * shape back as `attachments[]`). A two-step upload-then-attach flow rather
 * than accepting a file directly on the message endpoint, so a failed
 * upload never leaves a half-created message.
 *
 * Authorization matches every other ticket endpoint: any authenticated
 * agent/team_lead/admin. The ticket-scoped Cloudinary folder this writes
 * into (see attachmentService) is what stops the resulting publicId from
 * being usable on a different ticket's message later.
 */
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const ticket = await getTicketById(id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");

  try {
    const attachment = await uploadTicketAttachment(id, file);
    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
