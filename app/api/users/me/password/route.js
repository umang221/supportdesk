import { NextResponse } from "next/server";
import { getCurrentUser, getCurrentSessionToken } from "@/lib/auth/session";
import { changeOwnPassword } from "@/server/services/userService";
import { validateChangePasswordInput } from "@/server/validators/adminValidators";
import { toErrorResponse } from "@/server/utils/http-error";
import { checkRateLimit } from "@/server/utils/rateLimit";

// Keyed by account id, not IP: this route requires a valid session already,
// so the actual risk is a stolen/replayed session cookie being used to
// brute-force the current-password check — throttling per-account stops
// that regardless of which IP the requests come from.
export const CHANGE_PASSWORD_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };

/**
 * Self-service password change — the only password path that requires
 * proving you know the current one (contrast with the admin-triggered
 * invite/reset and the forgot-password flow, both token-based). See
 * userService.changeOwnPassword for the current-password check and the
 * "invalidate every other session" behavior.
 */
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { allowed, retryAfterMs } = checkRateLimit(`change-password:user:${user.id}`, CHANGE_PASSWORD_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const { currentPassword, newPassword } = validateChangePasswordInput(body);
    const currentSessionToken = await getCurrentSessionToken();
    await changeOwnPassword(user.id, currentPassword, newPassword, currentSessionToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
