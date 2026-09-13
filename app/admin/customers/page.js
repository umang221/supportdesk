import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminCustomers } from "@/components/admin/AdminCustomers";
import { customers, tickets } from "@/lib/mock-data";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Customers · Admin · SupportDesk" };

export default async function AdminCustomersPage() {
  const user = await getCurrentUser();
  return (
    <AppShell activeHref="/admin/customers" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-5xl p-space-lg">
        <AdminCustomers customers={customers} tickets={tickets} />
      </div>
    </AppShell>
  );
}
