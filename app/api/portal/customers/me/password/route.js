import { NextResponse } from "next/server";
import { getCurrentCustomer, getCurrentCustomerSessionToken } from "@/lib/portal/current-customer";
import { changeOwnPassword } from "@/server/services/customerAuthService";
import { validateChangePasswordInput } from "@/server/validators/adminValidators";
import { toErrorResponse } from "@/server/utils/http-error";
import { checkRateLimit } from "@/server/utils/rateLimit";

// Same reasoning as app/api/users/me/password/route.js — keyed by account
// id since this route already requires a valid session.
export const CHANGE_PASSWORD_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };

/**
 * Self-service password change for the signed-in customer — the only
 * customer password path that requires proving you know the current one
 * (contrast with the token-based forgot-password/reset flow). See
 * customerAuthService.changeOwnPassword for the current-password check and
 * the "invalidate every other session" behavior.
 */
export async function POST(request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { allowed, retryAfterMs } = checkRateLimit(`change-password:customer:${customer.id}`, CHANGE_PASSWORD_RATE_LIMIT);
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
    const currentSessionToken = await getCurrentCustomerSessionToken();
    await changeOwnPassword(customer.id, currentPassword, newPassword, currentSessionToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
