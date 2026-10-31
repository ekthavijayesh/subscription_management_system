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
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { createProductAction } from "@/app/actions/products";
import { useToast } from "@/components/ui/use-toast";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: ProductFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createProductAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to create product");
      toast({
        title: "Error",
        description: res.error || "Failed to create product",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Product Created",
        description: "Product initialized successfully.",
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <FormField label="Product Name" required>
            <Input name="name" placeholder="Pro Analytics Suite" required />
          </FormField>

          <FormField label="SKU / Identifier" required description="Unique code for inventory and quotation matching">
            <Input name="sku" placeholder="PROD-ANALYTICS" required />
          </FormField>

          <FormField label="Description">
            <Textarea
              name="description"
              placeholder="Enterprise-ready analytics platform for modern teams..."
              rows={3}
            />
          </FormField>

          <input type="hidden" name="isActive" value="true" />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Save Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

