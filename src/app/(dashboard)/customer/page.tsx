import { requireRole } from "@/lib/auth/authorization";
import { getCustomerAnalytics } from "@/lib/services/analytics";
import { CustomerAnalyticsView } from "@/components/features/analytics/customer-analytics-view";

export default async function CustomerDashboardPage() {
  const session = await requireRole(["customer"]);
  const metrics = await getCustomerAnalytics(session.profile.id);

  return (
    <CustomerAnalyticsView
      metrics={metrics}
      customerName={session.profile.full_name || session.profile.email}
    />
  );
}
