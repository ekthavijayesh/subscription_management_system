import { requireRole } from "@/lib/auth/authorization";
import { DashboardShell } from "@/components/shared/dashboard-layout";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["staff", "admin"]);

  return (
    <DashboardShell
      role="staff"
      userEmail={session.profile.email}
      userName={session.profile.full_name}
    >
      {children}
    </DashboardShell>
  );
}
