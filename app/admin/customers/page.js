import { AppShell } from "@/components/layout/AppShell";
import { AdminCustomers } from "@/components/admin/AdminCustomers";
import { customers, tickets } from "@/lib/mock-data";

export const metadata = { title: "Customers · Admin · SupportDesk" };

export default function AdminCustomersPage() {
  return (
    <AppShell activeHref="/admin/customers" navVariant="admin">
      <div className="mx-auto w-full max-w-5xl p-lg">
        <AdminCustomers customers={customers} tickets={tickets} />
      </div>
    </AppShell>
  );
}
