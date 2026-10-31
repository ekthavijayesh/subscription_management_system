"use client";

import * as React from "react";
import { ProductTable } from "@/components/features/products/product-table";
import { ProductFormDialog } from "@/components/features/products/product-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/services/catalogue";

export function ProductManagement({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Products &amp; Inventory
          </h1>
          <p className="text-sm text-slate-500">
            Define sellable products, variants, and base identifiers for recurring subscription plans.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          <span>New Product</span>
        </Button>
      </div>

      <ProductTable
        products={initialProducts}
        onAddClick={() => setDialogOpen(true)}
      />

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

