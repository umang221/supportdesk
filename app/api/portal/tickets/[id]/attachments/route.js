import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/portal/current-customer";
import { getTicketForCustomer } from "@/server/services/ticketService";
import { uploadTicketAttachment } from "@/server/attachments/attachmentService";
import { toErrorResponse } from "@/server/utils/http-error";
import { checkRateLimit } from "@/server/utils/rateLimit";

// Keyed by account id (this route already requires a session) — bounds how
// many uploads a single customer account can push through regardless of
// which ticket, to stop a compromised/malicious account from spamming
// Cloudinary storage or the message thread with attachments.
export const PORTAL_ATTACHMENT_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 20 };

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

  const { allowed, retryAfterMs } = checkRateLimit(`portal-attachment:${customer.id}`, PORTAL_ATTACHMENT_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
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
