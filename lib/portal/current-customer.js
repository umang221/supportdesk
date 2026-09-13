import { getCustomerById } from "@/lib/mock-data";

/**
 * The customer portal has no auth yet, so there's no real signed-in session.
 * This pins the portal to a single mock customer so the flow (dashboard,
 * tickets, profile) has someone consistent to render for — swap this for the
 * session-derived customer once auth exists.
 */
export const CURRENT_CUSTOMER_ID = "cust-01";

export function getCurrentCustomer() {
  return getCustomerById(CURRENT_CUSTOMER_ID);
}
