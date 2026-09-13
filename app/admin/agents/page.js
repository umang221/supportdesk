import { AppShell } from "@/components/layout/AppShell";
import { AdminAgents } from "@/components/admin/AdminAgents";
import { agents, teams, tickets } from "@/lib/mock-data";

export const metadata = { title: "Agents · Admin · SupportDesk" };

export default function AdminAgentsPage() {
  return (
    <AppShell activeHref="/admin/agents" navVariant="admin">
      <div className="mx-auto w-full max-w-5xl p-lg">
        <AdminAgents agents={agents} teams={teams} tickets={tickets} />
      </div>
    </AppShell>
  );
}
