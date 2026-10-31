import { requireRole } from "@/lib/auth/authorization";
import { getActiveSellableCatalogue } from "@/lib/services/catalogue";
import { CatalogueGrid } from "@/components/features/catalogue/catalogue-grid";

export default async function StaffCataloguePage() {
  await requireRole(["staff", "admin"]);
  const products = await getActiveSellableCatalogue();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Active Product Catalogue
        </h1>
        <p className="text-sm text-slate-500">
          Browse sellable products, variants and verified server plan pricing for quotation creation.
        </p>
      </div>

      <CatalogueGrid products={products} role="staff" />
    </div>
  );
}

