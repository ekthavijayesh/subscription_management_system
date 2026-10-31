"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { FormField } from "@/components/shared/form-field";
import { CustomerAssignmentDialog } from "@/components/features/customers/customer-assignment-dialog";
import { updateCustomerAction } from "@/app/actions/customers";
import { toggleAssignmentAction } from "@/app/actions/assignments";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, UserPlus, UserCheck, Shield } from "lucide-react";
import type { CustomerProfile } from "@/lib/services/customer";
import type { StaffProfile } from "@/lib/services/staff";

interface CustomerDetailViewProps {
  customer: CustomerProfile;
  role: "admin" | "staff";
  assignments: any[];
  availableStaff?: StaffProfile[];
}

export function CustomerDetailView({
  customer,
  role,
  assignments,
  availableStaff = [],
}: CustomerDetailViewProps) {
  const { toast } = useToast();
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const billing = (customer.billing_address as any) || {};

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    formData.append("id", customer.id);

    const res = await updateCustomerAction(formData);
    setSaving(false);

    if (!res.success) {
      toast({
        title: "Error",
        description: res.error || "Failed to update customer",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved",
        description: "Customer profile updated successfully.",
      });
    }
  };

  const handleToggleAssignment = async (assignmentId: string, currentActive: boolean) => {
    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("isActive", (!currentActive).toString());

    const res = await toggleAssignmentAction(formData);
    if (!res.success) {
      toast({
        title: "Error",
        description: res.error || "Failed to update assignment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: `Staff assignment ${currentActive ? "revoked" : "activated"}.`,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Link */}
      <div>
        <Link
          href={`/${role}/customers`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to customers</span>
        </Link>
      </div>

      {/* Header Profile Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {customer.full_name || "Customer Detail"}
            </h1>
            <StatusBadge status={customer.is_active} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{customer.email}</p>
        </div>

        {role === "admin" && (
          <Button
            onClick={() => setAssignDialogOpen(true)}
            size="sm"
            className="flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>Assign Staff</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Edit Customer Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <FormField label="Full Name" required>
                  <Input
                    name="fullName"
                    defaultValue={customer.full_name || ""}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Company Name">
                    <Input
                      name="companyName"
                      defaultValue={customer.company_name || ""}
                    />
                  </FormField>
                  <FormField label="Phone Number">
                    <Input
                      name="phone"
                      defaultValue={customer.phone || ""}
                    />
                  </FormField>
                </div>

                <div className="pt-2 border-t space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Billing Address
                  </h4>
                  <FormField label="Street">
                    <Input name="street" defaultValue={billing.street || ""} />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="City">
                      <Input name="city" defaultValue={billing.city || ""} />
                    </FormField>
                    <FormField label="Country">
                      <Input name="country" defaultValue={billing.country || ""} />
                    </FormField>
                  </div>
                </div>

                {role === "admin" && (
                  <div className="pt-2 border-t">
                    <FormField label="Active Status">
                      <select
                        name="isActive"
                        defaultValue={customer.is_active ? "true" : "false"}
                        className="w-full text-sm border rounded-md p-2 bg-transparent"
                      >
                        <option value="true">Active Account</option>
                        <option value="false">Inactive Account</option>
                      </select>
                    </FormField>
                  </div>
                )}

                <div className="pt-2">
                  <Button type="submit" disabled={saving} size="sm">
                    {saving ? "Saving Changes..." : "Save Customer Details"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Assigned Staff Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Assigned Staff</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No staff members currently assigned to this account.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments.map((a) => (
                    <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{a.profiles?.full_name || a.profiles?.email || "Staff"}</span>
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {a.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {role === "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAssignment(a.id, a.is_active)}
                          className="h-6 text-[11px] px-2 text-slate-500 hover:text-red-600"
                        >
                          {a.is_active ? "Revoke" : "Restore"}
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

      {role === "admin" && (
        <CustomerAssignmentDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          customerId={customer.id}
          customerName={customer.full_name || customer.email}
          availableStaff={availableStaff}
        />
      )}
    </div>
  );
}

