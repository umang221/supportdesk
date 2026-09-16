import { NextResponse } from "next/server";
import { verifyCustomerCredentials, createCustomerSession } from "@/server/services/customerAuthService";
import { validateCustomerLoginInput } from "@/server/validators/customerAuthValidators";
import { CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/portal/current-customer";
import { checkRateLimit, getClientIp } from "@/server/utils/rateLimit";
import { toErrorResponse } from "@/server/utils/http-error";

const LOGIN_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 10 };

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const { email, password } = validateCustomerLoginInput(body);

    const rateLimitKey = `portal-login:${getClientIp(request)}:${email.toLowerCase()}`;
    const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const customer = await verifyCustomerCredentials(email, password);
    if (!customer) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const { token, expiresAt } = await createCustomerSession(customer.id);

    const response = NextResponse.json({ customer });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
