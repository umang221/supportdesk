import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminTeams } from "@/components/admin/AdminTeams";
import { teams, agents, tickets } from "@/lib/mock-data";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Teams · Admin · SupportDesk" };

export default async function AdminTeamsPage() {
  const user = await getCurrentUser();
  return (
    <AppShell activeHref="/admin/teams" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-5xl p-space-lg">
        <AdminTeams teams={teams} agents={agents} tickets={tickets} />
      </div>
    </AppShell>
  );
}
