import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/portal/current-customer";
import { uploadAvatar } from "@/server/attachments/avatarService";
import { updateOwnAvatar } from "@/server/services/customerAuthService";
import { toErrorResponse } from "@/server/utils/http-error";

/** Uploads a new avatar for the signed-in customer and persists its URL. */
export async function POST(request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");

  try {
    const avatarUrl = await uploadAvatar("customers", customer.id, file);
    const updated = await updateOwnAvatar(customer.id, avatarUrl);
    return NextResponse.json({ customer: updated });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
