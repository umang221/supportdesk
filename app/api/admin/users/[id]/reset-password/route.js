import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { assertApiRole } from "@/lib/auth/authorization";
import { resetUserPassword } from "@/server/services/userService";
import { toErrorResponse } from "@/server/utils/http-error";

/** Admin-only: emails the agent a fresh set-password link (see userService.resetUserPassword). */
export async function POST(_request, { params }) {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);

    const { id } = await params;
    const result = await resetUserPassword(id, user);
    if (!result) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
