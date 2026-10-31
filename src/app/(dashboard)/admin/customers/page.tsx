import { requireRole } from "@/lib/auth/authorization";
import { getScopedCustomers } from "@/lib/services/customer";
import { CustomerManagement } from "@/components/features/customers/customer-management";

export default async function AdminCustomersPage() {
  const session = await requireRole(["admin"]);
  const customers = await getScopedCustomers("admin", session.profile.id);

  return <CustomerManagement initialCustomers={customers} role="admin" />;
}

