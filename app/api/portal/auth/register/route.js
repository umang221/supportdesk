import { NextResponse } from "next/server";
import { registerCustomer, createCustomerSession } from "@/server/services/customerAuthService";
import { validateCustomerRegisterInput } from "@/server/validators/customerAuthValidators";
import { CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/portal/current-customer";
import { toErrorResponse } from "@/server/utils/http-error";
import { checkRateLimit, getClientIp } from "@/server/utils/rateLimit";

const REGISTER_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 10 };

/** Public — customer self-registration (architecture decision: customers self-register, staff never do). Signs the new customer straight in. */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const { allowed, retryAfterMs } = checkRateLimit(`register:${getClientIp(request)}`, REGISTER_RATE_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const input = validateCustomerRegisterInput(body);
    const customer = await registerCustomer(input);
    const { token, expiresAt } = await createCustomerSession(customer.id);

    const response = NextResponse.json({ customer }, { status: 201 });
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
