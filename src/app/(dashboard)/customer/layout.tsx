import { requireRole } from "@/lib/auth/authorization";
import { DashboardShell } from "@/components/shared/dashboard-layout";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["customer", "staff", "admin"]);

  return (
    <DashboardShell
      role="customer"
      userEmail={session.profile.email}
      userName={session.profile.full_name}
    >
      {children}
    </DashboardShell>
  );
}
