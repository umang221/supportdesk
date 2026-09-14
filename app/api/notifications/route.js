import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listNotificationsForUser } from "@/server/services/notificationService";
import { toErrorResponse } from "@/server/utils/http-error";

/** Lists the authenticated user's own notifications. Scoped server-side to the session user's id — never a client-supplied recipient. */
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams);
    const result = await listNotificationsForUser(user.id, query);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
