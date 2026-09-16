import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalTicketDetail } from "@/components/portal/PortalTicketDetail";
import { getTicketById } from "@/server/services/ticketService";
import { listMessagesForCustomerTicket } from "@/server/services/messageService";
import { normalizeTicket, normalizeMessage } from "@/lib/api/ticket-adapter";
import { getCurrentCustomer } from "@/lib/portal/current-customer";

// Messages now come from a live DB read (see listMessagesForCustomerTicket),
// same reasoning as app/portal/(app)/tickets/page.js's dynamic export.
export const dynamic = "force-dynamic";

export const metadata = { title: "Ticket · Customer Portal" };

export default async function PortalTicketDetailPage({ params }) {
  const { id } = await params;
  const customer = await getCurrentCustomer();
  const rawTicket = await getTicketById(id);
  const ticket = normalizeTicket(rawTicket);

  // A customer should never be able to open another customer's ticket by
  // guessing/editing the URL.
  if (!ticket || !customer || ticket.customerId !== customer.id) {
    notFound();
  }

  // Internal notes are already filtered out inside the service — see
  // messageService.listMessagesForCustomerTicket — so this component never
  // even receives them, regardless of anything client-side.
  const rawMessages = await listMessagesForCustomerTicket(id);
  const messages = (rawMessages ?? []).map(normalizeMessage);

  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <PortalShell activeHref="/portal/tickets" customer={customer}>
      <PortalTicketDetail
        ticket={ticket}
        customer={ticket.customer ?? customer}
        assignee={ticket.assignee}
        team={ticket.team}
        messages={messages}
        initialNow={initialNow}
      />
    </PortalShell>
  );
}
