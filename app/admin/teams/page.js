import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminTeams } from "@/components/admin/AdminTeams";
import { getCurrentUser } from "@/lib/auth/session";
import { listTeams } from "@/server/services/teamService";
import { listUsersForAdmin } from "@/server/services/userService";
import { listTickets } from "@/server/services/ticketService";
import { normalizeAdminAgent, normalizeAdminTeam } from "@/lib/api/admin-adapter";
import { normalizeTicket } from "@/lib/api/ticket-adapter";

export const metadata = { title: "Teams · Admin · SupportDesk" };

export default async function AdminTeamsPage() {
  const user = await getCurrentUser();
  const [teams, users, { tickets }] = await Promise.all([
    listTeams(),
    listUsersForAdmin(),
    listTickets({ limit: 100 }),
  ]);

  // Forces AdminTeams to remount with this render's data on every real
  // navigation, including browser back/forward — see AdminAgentsPage's
  // identical comment for the full reasoning.
  // eslint-disable-next-line react-hooks/purity
  const renderKey = Date.now();

  return (
    <AppShell activeHref="/admin/teams" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-5xl p-space-lg">
        <AdminTeams
          key={renderKey}
          teams={teams.map(normalizeAdminTeam)}
          agents={users.map(normalizeAdminAgent)}
          tickets={tickets.map(normalizeTicket)}
        />
      </div>
    </AppShell>
  );
}
