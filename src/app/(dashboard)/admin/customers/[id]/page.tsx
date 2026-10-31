import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { getScopedCustomerById } from "@/lib/services/customer";
import { getAllStaffMembers } from "@/lib/services/staff";
import { CustomerDetailView } from "@/components/features/customers/customer-detail-view";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireRole(["admin"]);
  const customer = await getScopedCustomerById(params.id, "admin", session.profile.id);

  if (!customer) {
    notFound();
  }

  const supabase = createClient();
  const [{ data: assignments }, availableStaff] = await Promise.all([
    supabase
      .from("customer_staff_assignments")
      .select("id, is_active, permissions, staff_id, profiles!customer_staff_assignments_staff_id_fkey(full_name, email)")
      .eq("customer_id", customer.id),
    getAllStaffMembers(),
  ]);

  return (
    <CustomerDetailView
      customer={customer}
      role="admin"
      assignments={assignments || []}
      availableStaff={availableStaff}
    />
  );
}

