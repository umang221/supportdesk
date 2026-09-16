import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCustomerSessionUser } from "@/server/services/customerAuthService";

export const CUSTOMER_SESSION_COOKIE_NAME = "sd_customer_session";

/**
 * Real, session-backed customer identity — replaces the earlier hardcoded
 * single-demo-customer stub now that customer registration/login exist
 * (server/services/customerAuthService.js). Wrapped in React's cache() for
 * the same reason as lib/auth/session.js's getCurrentUser: a layout and the
 * page it wraps both call this per request, and should only hit the
 * database once. Returns null when signed out; never throws for that case.
 */
export const getCurrentCustomer = cache(async function getCurrentCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return getCustomerSessionUser(token);
});

/** Guard for the protected portal route group (see app/portal/(app)/layout.js): resolves the current customer or redirects to /portal/login. */
export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/portal/login");
  }
  return customer;
}
