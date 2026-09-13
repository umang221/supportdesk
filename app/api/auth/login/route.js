import { NextResponse } from "next/server";
import { verifyCredentials, createSession } from "@/server/services/authService";
import { validateLoginInput } from "@/server/validators/authValidators";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { valid, errors, email, password } = validateLoginInput(body);
  if (!valid) {
    return NextResponse.json({ error: "Invalid input.", fieldErrors: errors }, { status: 400 });
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const { token, expiresAt } = await createSession(user.id);

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return response;
}
