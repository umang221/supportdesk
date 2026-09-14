import { PortalShell } from "@/components/portal/PortalShell";
import { PortalTicketList } from "@/components/portal/PortalTicketList";
import { listTickets } from "@/server/services/ticketService";
import { normalizeTicket } from "@/lib/api/ticket-adapter";
import { getCurrentCustomer } from "@/lib/portal/current-customer";

// See app/portal/page.js for why this must stay dynamic (live DB reads).
export const dynamic = "force-dynamic";

export const metadata = { title: "My Tickets · Customer Portal" };

export default async function PortalTicketsPage() {
  const customer = await getCurrentCustomer();
  const { tickets: rawTickets } = customer
    ? await listTickets({ customer: customer.id, limit: 100 })
    : { tickets: [] };
  const tickets = rawTickets.map(normalizeTicket);

  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <PortalShell activeHref="/portal/tickets" customer={customer}>
      <PortalTicketList tickets={tickets} initialNow={initialNow} />
    </PortalShell>
  );
}
