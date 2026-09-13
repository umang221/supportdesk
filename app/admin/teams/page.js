import { AppShell } from "@/components/layout/AppShell";
import { AdminTeams } from "@/components/admin/AdminTeams";
import { teams, agents, tickets } from "@/lib/mock-data";

export const metadata = { title: "Teams · Admin · SupportDesk" };

export default function AdminTeamsPage() {
  return (
    <AppShell activeHref="/admin/teams" navVariant="admin">
      <div className="mx-auto w-full max-w-5xl p-lg">
        <AdminTeams teams={teams} agents={agents} tickets={tickets} />
      </div>
    </AppShell>
  );
}
