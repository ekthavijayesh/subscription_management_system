"use client";

import * as React from "react";
import { CustomerTable } from "@/components/features/customers/customer-table";
import { CustomerFormDialog } from "@/components/features/customers/customer-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { CustomerProfile } from "@/lib/services/customer";

export function CustomerManagement({
  initialCustomers,
  role,
}: {
  initialCustomers: CustomerProfile[];
  role: "admin" | "staff";
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {role === "admin" ? "Customer Directory" : "Assigned Customers"}
          </h1>
          <p className="text-sm text-slate-500">
            {role === "admin"
              ? "Manage all registered client accounts, staff assignments and profile details."
              : "Customers actively assigned to you under Row-Level Security."}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </Button>
      </div>

      <CustomerTable
        customers={initialCustomers}
        role={role}
        onAddClick={() => setDialogOpen(true)}
      />

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

