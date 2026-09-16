import { v2 as cloudinary } from "cloudinary";
import { HttpError } from "@/server/utils/http-error";

/**
 * Shared Cloudinary setup for every upload flow in the app (ticket
 * attachments — attachmentService.js, profile avatars — avatarService.js).
 * Kept in one place so both fail the exact same way, with the exact same
 * message, when Cloudinary isn't configured — rather than two independently
 * maintained copies of the same env-var check drifting apart over time.
 */
export function assertUploadsConfigured() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new HttpError(503, "File uploads are not configured.", { code: "uploads_disabled" });
  }
}

let isConfigured = false;
export function ensureCloudinaryConfigured() {
  if (isConfigured) return;
  assertUploadsConfigured();
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  isConfigured = true;
}

export { cloudinary };
