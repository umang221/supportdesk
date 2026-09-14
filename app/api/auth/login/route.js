import { NextResponse } from "next/server";
import { verifyCredentials, createSession } from "@/server/services/authService";
import { validateLoginInput } from "@/server/validators/authValidators";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { checkRateLimit } from "@/server/utils/rateLimit";

// Keyed by IP + the attempted email so one bad actor can't lock out other
// accounts sharing an IP (an office/NAT), and a distributed attacker still
// gets throttled per-account. Generous enough not to lock out a genuine user
// mistyping their password a few times.
const LOGIN_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 10 };

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

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

  const rateLimitKey = `login:${getClientIp(request)}:${email.toLowerCase()}`;
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
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
