import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { getScopedCustomerById } from "@/lib/services/customer";
import { CustomerDetailView } from "@/components/features/customers/customer-detail-view";

export default async function StaffCustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireRole(["staff"]);
  const customer = await getScopedCustomerById(params.id, "staff", session.profile.id);

  if (!customer) {
    notFound();
  }

  const supabase = createClient();
  const { data: assignments } = await supabase
    .from("customer_staff_assignments")
    .select("id, is_active, permissions, staff_id, profiles!customer_staff_assignments_staff_id_fkey(full_name, email)")
    .eq("customer_id", customer.id);

  return (
    <CustomerDetailView
      customer={customer}
      role="staff"
      assignments={assignments || []}
    />
  );
}

