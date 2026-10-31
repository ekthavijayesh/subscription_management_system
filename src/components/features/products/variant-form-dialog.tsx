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
import { FormField } from "@/components/shared/form-field";
import { createVariantAction } from "@/app/actions/variants";
import { useToast } from "@/components/ui/use-toast";

interface VariantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  onSuccess?: () => void;
}

export function VariantFormDialog({
  open,
  onOpenChange,
  productId,
  productName,
  onSuccess,
}: VariantFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("productId", productId);

    const res = await createVariantAction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to create variant");
      toast({
        title: "Error",
        description: res.error || "Failed to create variant",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Variant Added",
        description: `Variant added to ${productName}.`,
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Variant to {productName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <FormField label="Variant Name" required>
            <Input name="name" placeholder="Enterprise Tier / 5 Seats" required />
          </FormField>

          <FormField label="Variant SKU" required>
            <Input name="sku" placeholder="PROD-ANALYTICS-ENT-5" required />
          </FormField>

          <input type="hidden" name="isActive" value="true" />
          <input type="hidden" name="attributes" value="{}" />

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
              {loading ? "Adding..." : "Add Variant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

