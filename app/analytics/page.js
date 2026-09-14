import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { getCurrentUser } from "@/lib/auth/session";
import { getAnalyticsSummary } from "@/server/services/analyticsService";

export const metadata = { title: "Analytics · SupportDesk" };

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  const summary = await getAnalyticsSummary();

  return (
    <AppShell activeHref="/analytics" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-6xl p-space-lg">
        <AnalyticsDashboard initialSummary={summary} />
      </div>
    </AppShell>
  );
}
