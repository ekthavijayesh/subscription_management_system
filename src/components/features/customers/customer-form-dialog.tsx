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
import { createCustomerAction } from "@/app/actions/customers";
import { useToast } from "@/components/ui/use-toast";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: CustomerFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createCustomerAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to create customer");
      toast({
        title: "Error",
        description: res.error || "Failed to create customer",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <FormField label="Full Name" required>
            <Input name="fullName" placeholder="Jane Doe" required />
          </FormField>

          <FormField label="Email Address" required>
            <Input name="email" type="email" placeholder="jane@company.com" required />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Company Name">
              <Input name="companyName" placeholder="Acme Corp" />
            </FormField>
            <FormField label="Phone Number">
              <Input name="phone" placeholder="+1 (555) 000-0000" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="City">
              <Input name="city" placeholder="San Francisco" />
            </FormField>
            <FormField label="Country">
              <Input name="country" placeholder="USA" />
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
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

