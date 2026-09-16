import { NextResponse } from "next/server";
import { getCurrentUser, getCurrentSessionToken } from "@/lib/auth/session";
import { changeOwnPassword } from "@/server/services/userService";
import { validateChangePasswordInput } from "@/server/validators/adminValidators";
import { toErrorResponse } from "@/server/utils/http-error";

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
