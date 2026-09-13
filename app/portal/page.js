import { PortalShell } from "@/components/portal/PortalShell";
import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { getTicketsByCustomer } from "@/lib/mock-data";
import { getCurrentCustomer } from "@/lib/portal/current-customer";

export const metadata = { title: "Dashboard · Customer Portal" };

export default function PortalDashboardPage() {
  const customer = getCurrentCustomer();
  const tickets = getTicketsByCustomer(customer.id);

  // See app/tickets/page.js for why this must be computed once on the server
  // and threaded down rather than read again during client hydration.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <PortalShell activeHref="/portal" customer={customer}>
      <PortalDashboard customer={customer} tickets={tickets} initialNow={initialNow} />
    </PortalShell>
  );
}
