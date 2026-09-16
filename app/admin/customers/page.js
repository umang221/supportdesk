import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminCustomers } from "@/components/admin/AdminCustomers";
import { getCurrentUser } from "@/lib/auth/session";
import { listCustomers } from "@/server/services/customerService";
import { listTickets } from "@/server/services/ticketService";
import { normalizeAdminCustomer } from "@/lib/api/admin-adapter";
import { normalizeTicket } from "@/lib/api/ticket-adapter";

export const metadata = { title: "Customers · Admin · SupportDesk" };

export default async function AdminCustomersPage() {
  const user = await getCurrentUser();
  const [customers, { tickets }] = await Promise.all([listCustomers(), listTickets({ limit: 100 })]);

  return (
    <AppShell activeHref="/admin/customers" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-5xl p-space-lg">
        <AdminCustomers customers={customers.map(normalizeAdminCustomer)} tickets={tickets.map(normalizeTicket)} />
      </div>
    </AppShell>
  );
}
