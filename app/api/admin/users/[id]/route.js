import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { assertApiRole } from "@/lib/auth/authorization";
import { updateUser, deleteUser } from "@/server/services/userService";
import { validateUpdateUserInput } from "@/server/validators/adminValidators";
import { toErrorResponse } from "@/server/utils/http-error";

/** Admin-only: change a user's role, team, title, or active status. */
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);

    const { id } = await params;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const patch = validateUpdateUserInput(body);
    const updated = await updateUser(id, patch, user);
    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ user: updated });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/** Admin-only: permanently remove an agent account (see userService.deleteUser for what happens to their tickets/sessions). */
export async function DELETE(_request, { params }) {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);

    const { id } = await params;
    const removed = await deleteUser(id, user);
    if (!removed) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
