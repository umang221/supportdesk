import { PortalShell } from "@/components/portal/PortalShell";
import { PortalTicketList } from "@/components/portal/PortalTicketList";
import { getTicketsByCustomer } from "@/lib/mock-data";
import { getCurrentCustomer } from "@/lib/portal/current-customer";

export const metadata = { title: "My Tickets · Customer Portal" };

export default function PortalTicketsPage() {
  const customer = getCurrentCustomer();
  const tickets = getTicketsByCustomer(customer.id);

  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <PortalShell activeHref="/portal/tickets" customer={customer}>
      <PortalTicketList tickets={tickets} initialNow={initialNow} />
    </PortalShell>
  );
}
