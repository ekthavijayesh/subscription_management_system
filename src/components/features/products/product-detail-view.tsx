"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { FormField } from "@/components/shared/form-field";
import { VariantFormDialog } from "@/components/features/products/variant-form-dialog";
import { updateProductAction, archiveProductAction } from "@/app/actions/products";
import { archiveVariantAction } from "@/app/actions/variants";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Layers, Package } from "lucide-react";
import type { ProductWithDetails } from "@/lib/services/catalogue";

interface ProductDetailViewProps {
  product: ProductWithDetails;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { toast } = useToast();
  const [variantDialogOpen, setVariantDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [archiving, setArchiving] = React.useState(false);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    formData.append("id", product.id);

    const res = await updateProductAction(formData);
    setSaving(false);

    if (!res.success) {
      toast({
        title: "Error",
        description: res.error || "Failed to update product",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved",
        description: "Product updated successfully.",
      });
    }
  };

  const handleArchiveProduct = async () => {
    setArchiving(true);
    const res = await archiveProductAction(product.id);
    setArchiving(false);

    if (!res.success) {
      toast({
        title: "Error",
        description: res.error || "Failed to archive product",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Archived",
        description: "Product archived. Historical references remain intact.",
      });
    }
  };

  const handleArchiveVariant = async (variantId: string) => {
    const res = await archiveVariantAction(variantId, product.id);
    if (!res.success) {
      toast({
        title: "Error",
        description: res.error || "Failed to archive variant",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Variant Archived",
        description: "Variant status updated to archived.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to products</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {product.name}
            </h1>
            <StatusBadge status={product.is_active ? "active" : "archived"} />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">SKU: {product.sku}</p>
        </div>

        {product.is_active && (
          <Button
            variant="outline"
            size="sm"
            disabled={archiving}
            onClick={handleArchiveProduct}
            className="text-amber-700 border-amber-300 hover:bg-amber-50"
          >
            {archiving ? "Archiving..." : "Archive Product"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Edit Product Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <FormField label="Product Name" required>
                  <Input name="name" defaultValue={product.name} required />
                </FormField>

                <FormField label="SKU" required>
                  <Input name="sku" defaultValue={product.sku || ""} required />
                </FormField>

                <FormField label="Description">
                  <Textarea
                    name="description"
                    defaultValue={product.description || ""}
                    rows={3}
                  />
                </FormField>

                <FormField label="Status">
                  <select
                    name="isActive"
                    defaultValue={product.is_active ? "true" : "false"}
                    className="w-full text-sm border rounded-md p-2 bg-transparent"
                  >
                    <option value="true">Active (Sellable)</option>
                    <option value="false">Archived (Historical Only)</option>
                  </select>
                </FormField>

                <Button type="submit" disabled={saving} size="sm">
                  {saving ? "Saving Changes..." : "Save Product Details"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Attached Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>Subscription Plans ({product.plans.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.plans.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No plans attached yet. Create a plan in Plan Management.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {product.plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="py-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {plan.name}
                        </p>
                        <p className="text-slate-500 capitalize">
                          Every {plan.interval_count > 1 ? `${plan.interval_count} ` : ""}
                          {plan.billing_interval}
                          {plan.interval_count > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {formatCurrency(Number(plan.price))}
                        </span>
                        <StatusBadge status={plan.is_active ? "active" : "archived"} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Product Variants */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-1.5">
                <Package className="h-4 w-4 text-slate-500" />
                <span>Variants</span>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setVariantDialogOpen(true)}
                className="h-7 text-xs flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </Button>
            </CardHeader>
            <CardContent>
              {product.variants.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No variants configured for this product.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {product.variants.map((v) => (
                    <div key={v.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {v.name}
                        </p>
                        <code className="text-[10px] text-slate-500 font-mono">
                          {v.sku}
                        </code>
                      </div>
                      {v.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchiveVariant(v.id)}
                          className="h-6 text-[11px] px-2 text-slate-500 hover:text-amber-700"
                        >
                          Archive
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <VariantFormDialog
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}

