import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminTicketsSla } from "@/components/admin/AdminTicketsSla";
import { getCurrentUser } from "@/lib/auth/session";
import { listTickets } from "@/server/services/ticketService";
import { listTeams } from "@/server/services/teamService";
import { listCustomers } from "@/server/services/customerService";
import { listUsersForAdmin } from "@/server/services/userService";
import { normalizeAdminAgent, normalizeAdminCustomer, normalizeAdminTeam } from "@/lib/api/admin-adapter";
import { normalizeTicket } from "@/lib/api/ticket-adapter";

export const metadata = { title: "Tickets & SLA · Admin · SupportDesk" };

export default async function AdminTicketsPage() {
  const user = await getCurrentUser();
  const [{ tickets }, teams, customers, users] = await Promise.all([
    listTickets({ limit: 100 }),
    listTeams(),
    listCustomers(),
    listUsersForAdmin(),
  ]);

  const normalizedTeams = teams.map(normalizeAdminTeam);
  const customersById = new Map(customers.map(normalizeAdminCustomer).map((customer) => [customer.id, customer]));
  const teamsById = new Map(normalizedTeams.map((team) => [team.id, team]));
  const agentsById = new Map(users.map(normalizeAdminAgent).map((agent) => [agent.id, agent]));

  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <AppShell
      activeHref="/admin/tickets"
      navVariant="admin"
      user={user}
      sidebarFooter={<UserMenu user={user} />}
    >
      <div className="mx-auto w-full max-w-6xl p-space-lg">
        <AdminTicketsSla
          tickets={tickets.map(normalizeTicket)}
          teams={normalizedTeams}
          customersById={customersById}
          teamsById={teamsById}
          agentsById={agentsById}
          initialNow={initialNow}
        />
      </div>
    </AppShell>
  );
}
