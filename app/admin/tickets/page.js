import { AppShell } from "@/components/layout/AppShell";
import { AdminTicketsSla } from "@/components/admin/AdminTicketsSla";
import { tickets, teams, customers, agents } from "@/lib/mock-data";

export const metadata = { title: "Tickets & SLA · Admin · SupportDesk" };

export default function AdminTicketsPage() {
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <AppShell activeHref="/admin/tickets" navVariant="admin">
      <div className="mx-auto w-full max-w-6xl p-lg">
        <AdminTicketsSla
          tickets={tickets}
          teams={teams}
          customersById={customersById}
          teamsById={teamsById}
          agentsById={agentsById}
          initialNow={initialNow}
        />
      </div>
    </AppShell>
  );
}
