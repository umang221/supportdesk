import { NextResponse } from "next/server";
import { deleteSession } from "@/server/services/authService";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  await deleteSession(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
