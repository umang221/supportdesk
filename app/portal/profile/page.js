import { PortalShell } from "@/components/portal/PortalShell";
import { PortalProfile } from "@/components/portal/PortalProfile";
import { getCurrentCustomer } from "@/lib/portal/current-customer";

export const metadata = { title: "Profile · Customer Portal" };

export default function ProfilePage() {
  const customer = getCurrentCustomer();

  return (
    <PortalShell activeHref="/portal/profile" customer={customer}>
      <PortalProfile customer={customer} />
    </PortalShell>
  );
}
