import { requireRole } from "@/lib/auth/authorization";
import { getActiveSellableCatalogue } from "@/lib/services/catalogue";
import { CatalogueGrid } from "@/components/features/catalogue/catalogue-grid";

export default async function CustomerCataloguePage() {
  await requireRole(["customer"]);
  const products = await getActiveSellableCatalogue();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Services &amp; Subscription Plans
        </h1>
        <p className="text-sm text-slate-500">
          Explore available SaaS subscriptions, service tiers, and billing terms.
        </p>
      </div>

      <CatalogueGrid products={products} role="customer" />
    </div>
  );
}

