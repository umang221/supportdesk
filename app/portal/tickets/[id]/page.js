import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalTicketDetail } from "@/components/portal/PortalTicketDetail";
import { agents, getTicketById, getAgentById, getTeamById, getMessagesByTicketId } from "@/lib/mock-data";
import { getCurrentCustomer } from "@/lib/portal/current-customer";

export const metadata = { title: "Ticket · Customer Portal" };

export default async function PortalTicketDetailPage({ params }) {
  const { id } = await params;
  const customer = getCurrentCustomer();
  const ticket = getTicketById(id);

  // A customer should never be able to open another customer's ticket by
  // guessing/editing the URL, even in this mock, session-less setup.
  if (!ticket || ticket.customerId !== customer.id) {
    notFound();
  }

  const assignee = ticket.assigneeId ? getAgentById(ticket.assigneeId) : null;
  const team = getTeamById(ticket.teamId);
  // Internal notes are agent-only — filtered out before the customer-facing
  // component ever receives the message list.
  const messages = getMessagesByTicketId(ticket.id).filter((message) => !message.isInternal);
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <PortalShell activeHref="/portal/tickets" customer={customer}>
      <PortalTicketDetail
        ticket={ticket}
        customer={customer}
        assignee={assignee}
        team={team}
        messages={messages}
        agentsById={agentsById}
        initialNow={initialNow}
      />
    </PortalShell>
  );
}
