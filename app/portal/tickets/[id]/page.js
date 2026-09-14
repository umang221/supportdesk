import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalTicketDetail } from "@/components/portal/PortalTicketDetail";
import { getTicketById } from "@/server/services/ticketService";
import { normalizeTicket } from "@/lib/api/ticket-adapter";
import { agents, getMessagesByTicketId } from "@/lib/mock-data";
import { getCurrentCustomer } from "@/lib/portal/current-customer";

export const metadata = { title: "Ticket · Customer Portal" };

export default async function PortalTicketDetailPage({ params }) {
  const { id } = await params;
  const customer = await getCurrentCustomer();
  const rawTicket = await getTicketById(id);
  const ticket = normalizeTicket(rawTicket);

  // A customer should never be able to open another customer's ticket by
  // guessing/editing the URL. There's no real customer session yet (see
  // lib/portal/current-customer.js), so this id match is the only guard —
  // the same limitation the mock version of this page already had.
  if (!ticket || !customer || ticket.customerId !== customer.id) {
    notFound();
  }

  // Message/conversation data has no backing API yet (out of scope for this
  // integration pass), so it still comes from the mock fixtures — joined by
  // ticketNumber, which the seed script set to match each mock ticket's id.
  // Internal notes are agent-only — filtered out before the customer-facing
  // component ever receives the message list.
  const messages = getMessagesByTicketId(ticket.ticketNumber).filter((message) => !message.isInternal);
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

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
        agentsById={agentsById}
        initialNow={initialNow}
      />
    </PortalShell>
  );
}
