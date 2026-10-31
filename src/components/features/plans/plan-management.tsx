"use client";

import * as React from "react";
import { PlanTable } from "@/components/features/plans/plan-table";
import { PlanFormDialog } from "@/components/features/plans/plan-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Plan, Product } from "@/lib/services/catalogue";

export function PlanManagement({
  initialPlans,
  products,
}: {
  initialPlans: (Plan & { product_name?: string })[];
  products: Product[];
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Subscription Plans
          </h1>
          <p className="text-sm text-slate-500">
            Configure recurring billing cadences, pricing rules, intervals and sellable references.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          <span>New Plan</span>
        </Button>
      </div>

      <PlanTable
        plans={initialPlans}
        onAddClick={() => setDialogOpen(true)}
      />

      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        products={products}
      />
    </div>
  );
}

