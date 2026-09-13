import { PortalShell } from "@/components/portal/PortalShell";
import { PortalNewTicketForm } from "@/components/portal/PortalNewTicketForm";
import { getCurrentCustomer } from "@/lib/portal/current-customer";

export const metadata = { title: "New Ticket · Customer Portal" };

export default function NewTicketPage() {
  const customer = getCurrentCustomer();

  return (
    <PortalShell activeHref="/portal/tickets/new" customer={customer}>
      <PortalNewTicketForm />
    </PortalShell>
  );
}
