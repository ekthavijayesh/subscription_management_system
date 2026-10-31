"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { createPlanAction } from "@/app/actions/plans";
import { useToast } from "@/components/ui/use-toast";
import type { Product } from "@/lib/services/catalogue";

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSuccess?: () => void;
}

export function PlanFormDialog({
  open,
  onOpenChange,
  products,
  onSuccess,
}: PlanFormDialogProps) {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = React.useState<string>("");
  const [selectedInterval, setSelectedInterval] = React.useState<string>("month");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError("Please select a product");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("productId", selectedProductId);
    formData.append("billingInterval", selectedInterval);
    formData.append("isActive", "true");

    const res = await createPlanAction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to create plan");
      toast({
        title: "Error",
        description: res.error || "Failed to create plan",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plan Created",
        description: "Subscription plan created and ready for quotations.",
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Subscription Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <FormField label="Parent Product" required>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose product..." />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter((p) => p.is_active)
                  .map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Plan Name" required>
            <Input name="name" placeholder="Monthly Standard" required />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Billing Cadence" required>
              <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Interval Count" required description="E.g. every 1 month">
              <Input
                name="intervalCount"
                type="number"
                min="1"
                defaultValue="1"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Price (USD)" required>
              <Input
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="49.00"
                required
              />
            </FormField>

            <FormField label="Currency">
              <Input name="currency" defaultValue="USD" readOnly className="bg-slate-50" />
            </FormField>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedProductId}>
              {loading ? "Creating..." : "Save Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

