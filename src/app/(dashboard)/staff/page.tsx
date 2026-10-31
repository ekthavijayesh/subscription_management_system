import { requireRole } from "@/lib/auth/authorization";
import { getStaffAnalytics } from "@/lib/services/analytics";
import { StaffAnalyticsView } from "@/components/features/analytics/staff-analytics-view";

export default async function StaffDashboardPage() {
  const session = await requireRole(["staff"]);
  const metrics = await getStaffAnalytics(session.profile.id);

  return <StaffAnalyticsView metrics={metrics} />;
}
