"use client";

import * as React from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { archiveProductAction } from "@/app/actions/products";
import { useToast } from "@/components/ui/use-toast";
import { ExternalLink } from "lucide-react";
import type { Product } from "@/lib/services/catalogue";

interface ProductTableProps {
  products: Product[];
  onAddClick?: () => void;
}

export function ProductTable({ products, onAddClick }: ProductTableProps) {
  const { toast } = useToast();
  const [archivingId, setArchivingId] = React.useState<string | null>(null);

  const handleArchive = async (id: string, name: string) => {
    setArchivingId(id);
    const res = await archiveProductAction(id);
    setArchivingId(null);

    if (!res.success) {
      toast({
        title: "Error",
        description: res.error || "Failed to archive product",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Archived",
        description: `Product "${name}" archived successfully (historical records preserved).`,
      });
    }
  };

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product Name",
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/products/${item.id}`}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>{item.name}</span>
            <ExternalLink className="h-3 w-3 inline" />
          </Link>
          <span className="text-xs text-slate-500 line-clamp-1">
            {item.description || "No description"}
          </span>
        </div>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      sortable: true,
      cell: (item) => (
        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
          {item.sku || "—"}
        </code>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      cell: (item) => <StatusBadge status={item.is_active ? "active" : "archived"} />,
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      cell: (item) => (
        <span className="text-xs text-slate-500">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/products/${item.id}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Manage
            </Button>
          </Link>
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
      data={products}
      columns={columns}
      keyExtractor={(item) => item.id}
      searchKey="name"
      searchPlaceholder="Search products by name..."
      emptyTitle="No products found"
      emptyDescription="Create your first sellable SaaS product to configure plans and subscriptions."
      emptyAction={
        onAddClick ? (
          <Button onClick={onAddClick} size="sm">
            Add Product
          </Button>
        ) : undefined
      }
    />
  );
}

