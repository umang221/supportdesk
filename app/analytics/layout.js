import { requireUser } from "@/lib/auth/session";

export default async function AnalyticsLayout({ children }) {
  await requireUser();
  return children;
}
