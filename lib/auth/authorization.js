import { forbidden } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

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
