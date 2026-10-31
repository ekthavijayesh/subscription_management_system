"use client";

import * as React from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { CustomerProfile } from "@/lib/services/customer";

interface CustomerTableProps {
  customers: CustomerProfile[];
  role: "admin" | "staff";
  onAddClick?: () => void;
}

export function CustomerTable({ customers, role, onAddClick }: CustomerTableProps) {
  const columns: Column<CustomerProfile>[] = [
    {
      key: "full_name",
      header: "Customer Name",
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col">
          <Link
            href={`/${role}/customers/${item.id}`}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>{item.full_name || "Unnamed Customer"}</span>
            <ExternalLink className="h-3 w-3 inline" />
          </Link>
          <span className="text-xs text-slate-500">{item.email}</span>
        </div>
      ),
    },
    {
      key: "company_name",
      header: "Company",
      sortable: true,
      cell: (item) => (
        <span className="text-slate-700 dark:text-slate-300">
          {item.company_name || "—"}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (item) => <span>{item.phone || "—"}</span>,
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      cell: (item) => <StatusBadge status={item.is_active} />,
    },
    {
      key: "created_at",
      header: "Joined",
      sortable: true,
      cell: (item) => (
        <span className="text-xs text-slate-500">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      cell: (item) => (
        <Link href={`/${role}/customers/${item.id}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            View Detail
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      data={customers}
      columns={columns}
      keyExtractor={(item) => item.id}
      searchKey="full_name"
      searchPlaceholder="Search customers by name..."
      emptyTitle="No customers found"
      emptyDescription="No registered customer records match your filter."
      emptyAction={
        onAddClick ? (
          <Button onClick={onAddClick} size="sm">
            Add Customer
          </Button>
        ) : undefined
      }
    />
  );
}

