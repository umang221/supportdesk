import { HttpError } from "@/server/utils/http-error";
import { cloudinary, ensureCloudinaryConfigured, assertUploadsConfigured } from "./cloudinaryConfig";

/**
 * Server-side Cloudinary integration for ticket message attachments.
 *
 * Why Cloudinary: the project context doc left storage undecided until
 * attachment work started (S3 vs Cloudinary); Cloudinary's Node SDK gives a
 * direct buffer-upload API and built-in signed-URL generation with no extra
 * infrastructure (no bucket/IAM policy setup), which fits this app's
 * single-process, no-ops-team scope better than wiring up S3 + a signing
 * library ourselves.
 *
 * Access control: every upload uses Cloudinary's `authenticated` delivery
 * type, which is not fetchable from a bare URL — only from a URL signed
 * with our API secret. Nothing here ever stores or returns an unsigned URL;
 * getSignedAttachmentUrl() is called fresh on every read (see
 * messageService.presentMessage) and the signature expires quickly, so a
 * link copied out of a response can't be replayed indefinitely. The actual
 * *authorization* check (is this viewer allowed to see this ticket at all)
 * happens before this module is ever reached — the message/ticket routes
 * require a session the same way every other ticket endpoint does.
 */

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
];
const SIGNED_URL_TTL_SECONDS = 5 * 60;

function attachmentFolder(ticketId) {
  return `supportdesk/tickets/${ticketId}`;
}

// assertUploadsConfigured is checked by messageService before it writes a
// message with attachments — deliberately called up front rather than only
// when getSignedAttachmentUrl is reached partway through presenting the
// created message, so an unconfigured environment fails before the DB write
// instead of after it (which would otherwise leave a saved message whose
// attachment can never get a working URL). Re-exported here (rather than
// only from cloudinaryConfig) so existing importers of this module don't
// need to change.
export { assertUploadsConfigured };

function resourceTypeFor(mimeType) {
  return mimeType.startsWith("image/") ? "image" : "raw";
}

/** Validates a File/Blob from a multipart form body — size, presence, and an allowlist of MIME types (screenshots, PDFs, plain-text logs; nothing executable). */
export function assertValidAttachmentFile(file) {
  if (!file || typeof file.arrayBuffer !== "function" || !file.size) {
    throw new HttpError(400, "No file provided.", { code: "validation_error", fieldErrors: { file: "A file is required." } });
  }
  const mimeType = file.type || "";
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new HttpError(400, `Unsupported file type: ${mimeType || "unknown"}.`, {
      code: "validation_error",
      fieldErrors: { file: `Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}.` },
    });
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new HttpError(400, `File exceeds the ${MAX_ATTACHMENT_BYTES / (1024 * 1024)}MB limit.`, {
      code: "validation_error",
      fieldErrors: { file: "File too large." },
    });
  }
}

/**
 * Uploads one validated file to Cloudinary, scoped under a per-ticket
 * folder. The returned `publicId` is namespaced by ticketId
 * (supportdesk/tickets/<ticketId>/...) specifically so
 * isAttachmentInTicketScope() can later reject a message that tries to
 * attach a publicId belonging to a different ticket.
 */
export async function uploadTicketAttachment(ticketId, file) {
  assertValidAttachmentFile(file);
  ensureCloudinaryConfigured();

  const mimeType = file.type;
  const resourceType = resourceTypeFor(mimeType);
  const filename = typeof file.name === "string" && file.name.trim() ? file.name.trim() : "attachment";
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: attachmentFolder(ticketId),
        resource_type: resourceType,
        type: "authenticated",
        use_filename: true,
        unique_filename: true,
      },
      (error, uploadResult) => (error ? reject(error) : resolve(uploadResult))
    );
    stream.end(buffer);
  });

  return {
    publicId: result.public_id,
    resourceType: result.resource_type,
    mimeType,
    filename,
    size: result.bytes,
    url: getSignedAttachmentUrl(result.public_id, result.resource_type),
  };
}

/** Short-lived signed URL for an `authenticated`-delivery Cloudinary asset. Regenerated on every call — never persisted. */
export function getSignedAttachmentUrl(publicId, resourceType) {
  ensureCloudinaryConfigured();
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS,
  });
}

/** True if `publicId` was uploaded under this ticket's own folder — see uploadTicketAttachment. */
export function isAttachmentInTicketScope(publicId, ticketId) {
  return typeof publicId === "string" && publicId.startsWith(`${attachmentFolder(ticketId)}/`);
}
