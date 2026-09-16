import { PortalShell } from "@/components/portal/PortalShell";
import { PortalProfile } from "@/components/portal/PortalProfile";
import { getCurrentCustomer } from "@/lib/portal/current-customer";

// See app/portal/page.js for why this must stay dynamic (live DB reads).
export const dynamic = "force-dynamic";

export const metadata = { title: "Profile · Customer Portal" };

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();

  return (
    <PortalShell activeHref="/portal/profile" customer={customer}>
      <PortalProfile customer={customer} />
    </PortalShell>
  );
}
