import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/services/authService";

export const SESSION_COOKIE_NAME = "sd_session";

/**
 * Reusable server-side helper for the current authenticated user. Wrapped in
 * React's `cache()` so a layout and the page it wraps — both of which may
 * call this during the same request — only hit the database once.
 * Returns null when signed out; never throws for that case.
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return getSessionUser(token);
});

/**
 * Guard for Server Component pages/layouts: resolves the current user or
 * redirects to /login. Use at the top of a protected route's layout so every
 * nested page inherits the check.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
