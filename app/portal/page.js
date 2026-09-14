import { PortalShell } from "@/components/portal/PortalShell";
import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { listTickets } from "@/server/services/ticketService";
import { normalizeTicket } from "@/lib/api/ticket-adapter";
import { getCurrentCustomer } from "@/lib/portal/current-customer";

// Reads live MongoDB ticket data on every request; without this Next would
// statically prerender it at build time and freeze on that one DB snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard · Customer Portal" };

export default async function PortalDashboardPage() {
  const customer = await getCurrentCustomer();
  const { tickets: rawTickets } = customer
    ? await listTickets({ customer: customer.id, limit: 100 })
    : { tickets: [] };
  const tickets = rawTickets.map(normalizeTicket);

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
