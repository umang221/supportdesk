import { NextResponse } from "next/server";
import { resetPasswordWithToken, createCustomerSession } from "@/server/services/customerAuthService";
import { validateResetPasswordInput } from "@/server/validators/customerAuthValidators";
import { CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/portal/current-customer";
import { toErrorResponse } from "@/server/utils/http-error";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const { token, password } = validateResetPasswordInput(body);
    const customer = await resetPasswordWithToken(token, password);
    const { token: sessionToken, expiresAt } = await createCustomerSession(customer.id);

    const response = NextResponse.json({ customer });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, sessionToken, {
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
