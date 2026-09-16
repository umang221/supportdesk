import { NextResponse } from "next/server";
import { deleteCustomerSession } from "@/server/services/customerAuthService";
import { CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/portal/current-customer";

export async function POST(request) {
  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  await deleteCustomerSession(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(CUSTOMER_SESSION_COOKIE_NAME);
  return response;
}
