import { forbidden } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { HttpError } from "@/server/utils/http-error";

/**
 * Authorization (what a signed-in user can access) — separate from
 * authentication (lib/auth/session.js, who they are). Every check here
 * takes its role from the server-side session user (DB-backed via
 * getCurrentUser), never from client input, so a user cannot escalate
 * their own access by sending a different role/id.
 */

export function hasRole(user, allowedRoles) {
  return !!user && allowedRoles.includes(user.role);
}

/**
 * Guard for Server Component pages/layouts: requires an authenticated user
 * (redirects to /login otherwise, via requireUser) whose role is one of
 * allowedRoles. Users who are authenticated but lack the role get a real
 * 403 via next/navigation's forbidden() (see app/forbidden.js for the UI).
 */
export async function requireRole(allowedRoles) {
  const user = await requireUser();
  if (!hasRole(user, allowedRoles)) {
    forbidden();
  }
  return user;
}

/**
 * Guard for API route handlers (which can't use next/navigation's
 * forbidden()/redirect() the way Server Components do): throws an
 * HttpError the route's existing toErrorResponse/catch block turns into a
 * 401/403 JSON response. `user` is whatever getCurrentUser() returned —
 * null means "not signed in" (401), signed in but wrong role means 403.
 */
export function assertApiRole(user, allowedRoles) {
  if (!user) {
    throw new HttpError(401, "Authentication required.", { code: "unauthenticated" });
  }
  if (!hasRole(user, allowedRoles)) {
    throw new HttpError(403, "You do not have permission to perform this action.", { code: "forbidden" });
  }
}
