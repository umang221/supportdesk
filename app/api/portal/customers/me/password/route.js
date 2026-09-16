import { NextResponse } from "next/server";
import { getCurrentCustomer, getCurrentCustomerSessionToken } from "@/lib/portal/current-customer";
import { changeOwnPassword } from "@/server/services/customerAuthService";
import { validateChangePasswordInput } from "@/server/validators/adminValidators";
import { toErrorResponse } from "@/server/utils/http-error";

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
