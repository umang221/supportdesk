import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { updateOwnProfile } from "@/server/services/userService";
import { validateUpdateOwnProfileInput } from "@/server/validators/adminValidators";
import { toErrorResponse } from "@/server/utils/http-error";

/**
 * Self-service profile update for the signed-in staff user — name/title
 * only. Deliberately separate from PATCH /api/admin/users/:id (admin-only,
 * role/team/isActive), and the id always comes from the session, never the
 * request body, so a caller can never edit anyone else's account.
 */
export async function PATCH(request) {
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
    const patch = validateUpdateOwnProfileInput(body);
    const updated = await updateOwnProfile(user.id, patch);
    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ user: updated });
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
