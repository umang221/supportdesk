import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { getCurrentUser } from "@/lib/auth/session";
import { listTickets } from "@/server/services/ticketService";
import { listTeams } from "@/server/services/teamService";
import { listCustomers } from "@/server/services/customerService";
import { normalizeAdminCustomer, normalizeAdminTeam } from "@/lib/api/admin-adapter";
import { normalizeTicket } from "@/lib/api/ticket-adapter";

export const metadata = { title: "Admin Overview · SupportDesk" };

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  const [{ tickets }, teams, customers] = await Promise.all([
    listTickets({ limit: 100 }),
    listTeams(),
    listCustomers(),
  ]);

  const normalizedTeams = teams.map(normalizeAdminTeam);
  const customersById = new Map(customers.map(normalizeAdminCustomer).map((customer) => [customer.id, customer]));
  const teamsById = new Map(normalizedTeams.map((team) => [team.id, team]));

  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <AppShell activeHref="/admin" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-5xl p-space-lg">
        <AdminOverview
          tickets={tickets.map(normalizeTicket)}
          customersById={customersById}
          teamsById={teamsById}
          teams={normalizedTeams}
          initialNow={initialNow}
        />
      </div>
    </AppShell>
  );
}
