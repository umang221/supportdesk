import { HttpError } from "@/server/utils/http-error";
import { isAttachmentInTicketScope } from "@/server/attachments/attachmentService";

const MAX_BODY_LENGTH = 10_000;
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

function validateAttachmentRef(raw, index, ticketId, errors) {
  const key = `attachments[${index}]`;
  if (!raw || typeof raw !== "object") {
    errors[key] = "Each attachment must be an object.";
    return null;
  }

  const { publicId, resourceType, mimeType, filename, size } = raw;

  // publicId must actually live under this ticket's own upload folder (see
  // attachmentService.uploadTicketAttachment) — this is what stops a client
  // from attaching someone else's (or another ticket's) Cloudinary asset by
  // just naming its publicId.
  if (typeof publicId !== "string" || !isAttachmentInTicketScope(publicId, ticketId)) {
    errors[key] = "Attachment does not belong to this ticket.";
    return null;
  }
  if (resourceType !== "image" && resourceType !== "raw") {
    errors[key] = "Invalid attachment resource type.";
    return null;
  }
  if (typeof mimeType !== "string" || !mimeType) {
    errors[key] = "Attachment is missing its file type.";
    return null;
  }
  if (typeof size !== "number" || size <= 0) {
    errors[key] = "Attachment is missing its size.";
    return null;
  }

  return { publicId, resourceType, mimeType, filename: typeof filename === "string" && filename ? filename : "attachment", size };
}

/**
 * Validates POST /api/tickets/:id/messages input. `attachments` (if
 * present) must be metadata already returned by
 * POST /api/tickets/:id/attachments for this same ticket — the client
 * uploads first, then references the result here; this never accepts a
 * raw file itself.
 */
export function validateCreateMessageInput(data, ticketId) {
  const errors = {};

  const body = typeof data?.body === "string" ? data.body.trim() : "";
  if (!body) errors.body = "Message body is required.";
  else if (body.length > MAX_BODY_LENGTH) errors.body = `Message must be ${MAX_BODY_LENGTH.toLocaleString()} characters or fewer.`;

  const isInternal = data?.isInternal === true;

  let attachments = [];
  if (data?.attachments !== undefined) {
    if (!Array.isArray(data.attachments)) {
      errors.attachments = "Attachments must be an array.";
    } else if (data.attachments.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      errors.attachments = `A message may have at most ${MAX_ATTACHMENTS_PER_MESSAGE} attachments.`;
    } else {
      attachments = data.attachments.map((ref, index) => validateAttachmentRef(ref, index, ticketId, errors));
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Invalid message input.", { code: "validation_error", fieldErrors: errors });
  }

  return { body, isInternal, attachments };
}
