import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { markNotificationRead } from "@/server/services/notificationService";
import { toErrorResponse } from "@/server/utils/http-error";

/**
 * Marks one notification read. Ownership is enforced in the service layer
 * (scoped lookup by recipient id), so this route can't be used to mark
 * another user's notification read even if their id is guessed.
 */
export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const notification = await markNotificationRead(id, user.id);
    if (!notification) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }
    return NextResponse.json({ notification });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
