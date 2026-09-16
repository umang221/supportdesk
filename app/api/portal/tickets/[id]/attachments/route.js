import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/portal/current-customer";
import { getTicketForCustomer } from "@/server/services/ticketService";
import { uploadTicketAttachment } from "@/server/attachments/attachmentService";
import { toErrorResponse } from "@/server/utils/http-error";

/**
 * Customer-authenticated counterpart to app/api/tickets/[id]/attachments —
 * same two-step upload-then-attach flow (this endpoint uploads and returns
 * metadata; POST /api/portal/tickets/:id/messages takes it back as
 * `attachments[]`). Ownership uses the same getTicketForCustomer check as
 * the portal messages route (404, not 403, for a ticket that isn't theirs).
 * uploadTicketAttachment/the Cloudinary folder scoping it relies on are
 * unchanged from the agent path — that module has never been author-aware.
 */
export async function POST(request, { params }) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const ticket = await getTicketForCustomer(id, customer.id);
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
