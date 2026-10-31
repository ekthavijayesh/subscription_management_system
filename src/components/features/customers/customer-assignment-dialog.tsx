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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { assignStaffAction } from "@/app/actions/assignments";
import { useToast } from "@/components/ui/use-toast";
import type { StaffProfile } from "@/lib/services/staff";

interface CustomerAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  availableStaff: StaffProfile[];
  onSuccess?: () => void;
}

export function CustomerAssignmentDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  availableStaff,
  onSuccess,
}: CustomerAssignmentDialogProps) {
  const { toast } = useToast();
  const [selectedStaffId, setSelectedStaffId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setError("Please select a staff member");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("customerId", customerId);
    formData.append("staffId", selectedStaffId);
    formData.append("permissions", "read");
    formData.append("permissions", "write");

    const res = await assignStaffAction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to assign staff");
      toast({
        title: "Error",
        description: res.error || "Failed to assign staff",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Assigned",
        description: `Successfully assigned staff to ${customerName}`,
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Staff to Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-500">
            Select a staff member to assign management responsibility for <strong>{customerName}</strong>.
          </p>

          <FormField label="Staff Member" required>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a staff member..." />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.full_name || staff.email} ({staff.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedStaffId}>
              {loading ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

