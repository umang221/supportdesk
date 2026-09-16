import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/portal/current-customer";
import { updateOwnProfile } from "@/server/services/customerAuthService";
import { validateCustomerUpdateProfileInput } from "@/server/validators/customerAuthValidators";
import { toErrorResponse } from "@/server/utils/http-error";

/**
 * Self-service profile update for the signed-in customer — name/phone/company
 * only (plan stays admin/billing-controlled, email has its own flow). The id
 * always comes from the session, never the request body.
 */
export async function PATCH(request) {
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
    const patch = validateCustomerUpdateProfileInput(body);
    const updated = await updateOwnProfile(customer.id, patch);
    if (!updated) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }
    return NextResponse.json({ customer: updated });
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
