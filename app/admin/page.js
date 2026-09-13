import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { tickets, customers, teams } from "@/lib/mock-data";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Admin Overview · SupportDesk" };

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <AppShell activeHref="/admin" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-5xl p-space-lg">
        <AdminOverview
          tickets={tickets}
          customersById={customersById}
          teamsById={teamsById}
          teams={teams}
          initialNow={initialNow}
        />
      </div>
    </AppShell>
  );
}
