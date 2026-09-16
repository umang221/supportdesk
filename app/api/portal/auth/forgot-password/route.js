import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/server/services/customerAuthService";
import { validateForgotPasswordInput } from "@/server/validators/customerAuthValidators";
import { toErrorResponse } from "@/server/utils/http-error";
import { checkRateLimit, getClientIp } from "@/server/utils/rateLimit";

const FORGOT_PASSWORD_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 };

/** Always returns the same generic success response regardless of whether the email has an account — see customerAuthService.requestPasswordReset. */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const { email } = validateForgotPasswordInput(body);

    const { allowed } = checkRateLimit(`forgot-password:${getClientIp(request)}`, FORGOT_PASSWORD_RATE_LIMIT);
    if (allowed) {
      await requestPasswordReset(email);
    }
    // A rate-limited request still returns the generic success message
    // below rather than a 429 — revealing that this specific action was
    // throttled would itself leak information an enumeration attempt could
    // use, and a genuine user retrying a few times loses nothing since the
    // message is identical either way.

    return NextResponse.json({
      message: "If an account exists for that email, we've sent a password reset link.",
    });
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
