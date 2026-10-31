import { requireRole } from "@/lib/auth/authorization";
import { getScopedCustomers } from "@/lib/services/customer";
import { CustomerManagement } from "@/components/features/customers/customer-management";

export default async function StaffCustomersPage() {
  const session = await requireRole(["staff"]);
  const customers = await getScopedCustomers("staff", session.profile.id);

  return <CustomerManagement initialCustomers={customers} role="staff" />;
}

