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
import { inviteStaffAction } from "@/app/actions/staff";
import { useToast } from "@/components/ui/use-toast";

interface StaffInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function StaffInviteDialog({
  open,
  onOpenChange,
  onSuccess,
}: StaffInviteDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await inviteStaffAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to invite staff");
      toast({
        title: "Error",
        description: res.error || "Failed to invite staff",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Staff Added",
        description: "Staff account created and access granted.",
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New Staff Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <FormField label="Full Name" required>
            <Input name="fullName" placeholder="John Smith" required />
          </FormField>

          <FormField label="Staff Email Address" required>
            <Input name="email" type="email" placeholder="john@internal.com" required />
          </FormField>

          <FormField label="Phone Number">
            <Input name="phone" placeholder="+1 (555) 234-5678" />
          </FormField>

          <input type="hidden" name="role" value="staff" />

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
              {loading ? "Inviting..." : "Create Staff Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

