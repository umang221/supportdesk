import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { uploadAvatar } from "@/server/attachments/avatarService";
import { updateOwnAvatar } from "@/server/services/userService";
import { toErrorResponse } from "@/server/utils/http-error";
import { checkRateLimit } from "@/server/utils/rateLimit";

// Keyed by account id — same reasoning as the other Task 23/24 self-service
// rate limits (bounds upload spam from a stolen/replayed session).
export const AVATAR_UPLOAD_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 10 };

/** Uploads a new avatar for the signed-in staff user and persists its URL. */
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { allowed, retryAfterMs } = checkRateLimit(`avatar-upload:user:${user.id}`, AVATAR_UPLOAD_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");

  try {
    const avatarUrl = await uploadAvatar("users", user.id, file);
    const updated = await updateOwnAvatar(user.id, avatarUrl);
    return NextResponse.json({ user: updated });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
