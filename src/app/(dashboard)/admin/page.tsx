import { requireRole } from "@/lib/auth/authorization";
import { getAdminAnalytics } from "@/lib/services/analytics";
import { AdminAnalyticsView } from "@/components/features/analytics/admin-analytics-view";

export default async function AdminDashboardPage() {
  await requireRole(["admin"]);
  const metrics = await getAdminAnalytics();

  return <AdminAnalyticsView metrics={metrics} />;
}
