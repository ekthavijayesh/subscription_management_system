import { requireRole } from "@/lib/auth/authorization";
import { DashboardShell } from "@/components/shared/dashboard-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["admin"]);

  return (
    <DashboardShell
      role="admin"
      userEmail={session.profile.email}
      userName={session.profile.full_name}
    >
      {children}
    </DashboardShell>
  );
}
