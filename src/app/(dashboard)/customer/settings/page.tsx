import { requireRole } from "@/lib/auth/authorization";
import { getScopedCustomerById } from "@/lib/services/customer";
import { CustomerSelfForm } from "@/components/features/customers/customer-self-form";

export default async function CustomerSettingsPage() {
  const session = await requireRole(["customer"]);
  const profile = await getScopedCustomerById(
    session.profile.id,
    "customer",
    session.profile.id
  );

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account Settings &amp; Profile
        </h1>
        <p className="text-sm text-slate-500">
          Manage your personal details, contact preferences and default billing address.
        </p>
      </div>

      <CustomerSelfForm profile={profile} />
    </div>
  );
}

