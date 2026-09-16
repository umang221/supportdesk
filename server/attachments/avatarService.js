import { HttpError } from "@/server/utils/http-error";
import { cloudinary, ensureCloudinaryConfigured, assertUploadsConfigured } from "./cloudinaryConfig";

/**
 * Profile avatar uploads — a deliberately separate, simpler flow from
 * attachmentService.js's ticket attachments, not a reuse of it:
 *
 * - Standard public delivery (`type: "upload"`), not `authenticated`. A
 *   profile picture isn't sensitive, access-controlled content the way a
 *   ticket attachment is, and it needs a stable URL usable directly in
 *   `<img src>` on every page load (sidebar, header) — a signed URL that
 *   expires in minutes would be the wrong tool here.
 * - A deterministic public_id per owner + `overwrite`/`invalidate` so
 *   re-uploading replaces the previous image (and busts any CDN cache of
 *   it) instead of accumulating orphaned assets.
 * - Images only, and a much smaller size cap than a ticket attachment.
 */

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export { assertUploadsConfigured };

function avatarPublicId(ownerType, ownerId) {
  return `supportdesk/avatars/${ownerType}/${ownerId}`;
}

/** Validates a File/Blob from a multipart form body — presence, size, and an image-only allowlist. */
export function assertValidAvatarFile(file) {
  if (!file || typeof file.arrayBuffer !== "function" || !file.size) {
    throw new HttpError(400, "No file provided.", { code: "validation_error", fieldErrors: { file: "A file is required." } });
  }
  const mimeType = file.type || "";
  if (!ALLOWED_AVATAR_MIME_TYPES.includes(mimeType)) {
    throw new HttpError(400, `Unsupported image type: ${mimeType || "unknown"}.`, {
      code: "validation_error",
      fieldErrors: { file: `Allowed types: ${ALLOWED_AVATAR_MIME_TYPES.join(", ")}.` },
    });
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new HttpError(400, `Image exceeds the ${MAX_AVATAR_BYTES / (1024 * 1024)}MB limit.`, {
      code: "validation_error",
      fieldErrors: { file: "File too large." },
    });
  }
}

/**
 * Uploads (or replaces) a profile avatar for a User or Customer.
 * `ownerType` is "users" or "customers" — kept as a plain string argument
 * rather than importing the Mongoose models here, since this module only
 * needs an id to namespace the Cloudinary public_id, never the document
 * itself (the caller's service persists the returned URL).
 */
export async function uploadAvatar(ownerType, ownerId, file) {
  assertValidAvatarFile(file);
  ensureCloudinaryConfigured();

  const buffer = Buffer.from(await file.arrayBuffer());
  const publicId = avatarPublicId(ownerType, ownerId);

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        type: "upload",
        overwrite: true,
        invalidate: true,
      },
      (error, uploadResult) => (error ? reject(error) : resolve(uploadResult))
    );
    stream.end(buffer);
  });

  return result.secure_url;
}
