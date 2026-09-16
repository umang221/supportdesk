import { PortalShell } from "@/components/portal/PortalShell";
import { PortalNewTicketForm } from "@/components/portal/PortalNewTicketForm";
import { getCurrentCustomer } from "@/lib/portal/current-customer";

// See app/portal/page.js for why this must stay dynamic (live DB reads).
export const dynamic = "force-dynamic";

export const metadata = { title: "New Ticket · Customer Portal" };

export default async function NewTicketPage() {
  const customer = await getCurrentCustomer();

  return (
    <PortalShell activeHref="/portal/tickets/new" customer={customer}>
      <PortalNewTicketForm />
    </PortalShell>
  );
}
