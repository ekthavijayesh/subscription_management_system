"use client";

import * as React from "react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { archivePlanAction } from "@/app/actions/plans";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { Plan } from "@/lib/services/catalogue";

interface PlanTableProps {
  plans: (Plan & { product_name?: string })[];
  onAddClick?: () => void;
}

export function PlanTable({ plans, onAddClick }: PlanTableProps) {
  const { toast } = useToast();
  const [archivingId, setArchivingId] = React.useState<string | null>(null);

  const handleArchive = async (id: string, name: string) => {
    setArchivingId(id);
    const res = await archivePlanAction(id);
    setArchivingId(null);

    if (!res.success) {
      toast({
        title: "Error",
        description: res.error || "Failed to archive plan",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Archived",
        description: `Plan "${name}" archived successfully (historical subscriptions remain safe).`,
      });
    }
  };

  const columns: Column<Plan & { product_name?: string }>[] = [
    {
      key: "name",
      header: "Plan Name",
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {item.name}
          </span>
          <span className="text-xs text-slate-500">
            Product: {item.product_name || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "billing_interval",
      header: "Cadence",
      sortable: true,
      cell: (item) => (
        <span className="capitalize text-slate-700 dark:text-slate-300">
          {item.interval_count > 1 ? `${item.interval_count} ` : ""}
          {item.billing_interval}
          {item.interval_count > 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      cell: (item) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(Number(item.price))}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      cell: (item) => <StatusBadge status={item.is_active ? "active" : "archived"} />,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          {item.is_active && (
            <Button
              variant="outline"
              size="sm"
              disabled={archivingId === item.id}
              onClick={() => handleArchive(item.id, item.name)}
              className="h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              {archivingId === item.id ? "Archiving..." : "Archive"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={plans}
      columns={columns}
      keyExtractor={(item) => item.id}
      searchKey="name"
      searchPlaceholder="Search plans by name..."
      emptyTitle="No plans configured"
      emptyDescription="Create plans defining pricing, intervals and currency for your products."
      emptyAction={
        onAddClick ? (
          <Button onClick={onAddClick} size="sm">
            Create Plan
          </Button>
        ) : undefined
      }
    />
  );
}

