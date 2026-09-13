import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminAgents } from "@/components/admin/AdminAgents";
import { agents, teams, tickets } from "@/lib/mock-data";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Agents · Admin · SupportDesk" };

export default async function AdminAgentsPage() {
  const user = await getCurrentUser();
  return (
    <AppShell activeHref="/admin/agents" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-5xl p-space-lg">
        <AdminAgents agents={agents} teams={teams} tickets={tickets} />
      </div>
    </AppShell>
  );
}
