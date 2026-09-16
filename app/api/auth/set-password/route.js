import { NextResponse } from "next/server";
import { setPasswordWithToken } from "@/server/services/userService";
import { createSession } from "@/server/services/authService";
import { validatePasswordInput } from "@/server/validators/adminValidators";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { toErrorResponse } from "@/server/utils/http-error";

/**
 * Completes an agent invite or admin-triggered password reset (see
 * userService.setPasswordWithToken). Deliberately unauthenticated — the
 * one-time token itself is the credential at this point, the same way a
 * session token is once logged in. On success, signs the agent straight in
 * (the "first-time login flow" — no separate login step after setting a
 * password) rather than sending them to /login to type it again.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const token = typeof body?.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "Missing token." }, { status: 400 });
    }
    const password = validatePasswordInput(body?.password);

    const user = await setPasswordWithToken(token, password);
    const { token: sessionToken, expiresAt } = await createSession(user.id);

    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
