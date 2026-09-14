import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { assertApiRole } from "@/lib/auth/authorization";
import { listUsersForAdmin, createUser } from "@/server/services/userService";
import { validateCreateUserInput } from "@/server/validators/adminValidators";
import { toErrorResponse } from "@/server/utils/http-error";

/** Admin-only user roster + account creation. Every sensitive field (role, activation) is edited through PATCH /api/admin/users/[id]. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);
    const users = await listUsersForAdmin();
    return NextResponse.json({ users });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const input = validateCreateUserInput(body);
    const created = await createUser(input, user);
    return NextResponse.json({ user: created }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
