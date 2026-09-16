import { requireCustomer } from "@/lib/portal/current-customer";

// Route group (no effect on the URL) so /portal, /portal/tickets,
// /portal/tickets/new, /portal/tickets/[id], and /portal/profile all sit
// behind one auth guard, while /portal/login, /portal/register,
// /portal/forgot-password, and /portal/reset-password stay outside it —
// they're how a signed-out visitor gets here in the first place.
export default async function PortalAppLayout({ children }) {
  await requireCustomer();
  return children;
}
