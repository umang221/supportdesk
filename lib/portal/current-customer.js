import { connectDB } from "@/server/utils/db";
import Customer from "@/server/models/Customer";

/**
 * The customer portal has no auth yet, so there's no real signed-in session.
 * This pins the portal to a single real customer record (by email, matching
 * the seeded mock customer this used to hardcode) so the flow (dashboard,
 * tickets, profile) has someone consistent to render for — swap this for the
 * session-derived customer once customer auth exists.
 */
export const CURRENT_CUSTOMER_EMAIL = "grace.whitfield@northfieldlogistics.com";

export async function getCurrentCustomer() {
  await connectDB();
  const customer = await Customer.findOne({ email: CURRENT_CUSTOMER_EMAIL }).lean();
  if (!customer) return null;

  return {
    id: customer._id.toString(),
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? null,
    company: customer.company ?? null,
    plan: customer.plan,
  };
}
