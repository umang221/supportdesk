import { AppShell } from "@/components/layout/AppShell";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { tickets, customers, teams } from "@/lib/mock-data";

export const metadata = { title: "Admin Overview · SupportDesk" };

export default function AdminOverviewPage() {
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <AppShell activeHref="/admin" navVariant="admin">
      <div className="mx-auto w-full max-w-5xl p-lg">
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
