"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { updateCustomerSelfAction } from "@/app/actions/customers";
import { useToast } from "@/components/ui/use-toast";
import type { CustomerProfile } from "@/lib/services/customer";

interface CustomerSelfFormProps {
  profile: CustomerProfile;
}

export function CustomerSelfForm({ profile }: CustomerSelfFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const billingAddr = (profile.billing_address as any) || {};

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateCustomerSelfAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to save profile");
      toast({
        title: "Error",
        description: res.error || "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: "Your profile details have been saved successfully.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="p-3 text-xs rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Account Info (Read-Only) */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Account Credentials
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500">Email Address</span>
            <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">
              {profile.email}
            </p>
          </div>
          <div>
            <span className="text-slate-500">Account Role</span>
            <p className="font-medium text-slate-900 dark:text-slate-100 capitalize mt-0.5">
              {profile.role}
            </p>
          </div>
        </div>
      </div>

      {/* Editable Profile Fields */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Personal &amp; Company Details
        </h3>

        <FormField label="Full Name" required>
          <Input
            name="fullName"
            defaultValue={profile.full_name || ""}
            placeholder="Your Name"
            required
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Company Name">
            <Input
              name="companyName"
              defaultValue={profile.company_name || ""}
              placeholder="Acme Corp"
            />
          </FormField>
          <FormField label="Phone Number">
            <Input
              name="phone"
              defaultValue={profile.phone || ""}
              placeholder="+1 (555) 000-0000"
            />
          </FormField>
        </div>
      </div>

      {/* Billing Address */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Billing Address
        </h3>

        <FormField label="Street Address">
          <Input
            name="street"
            defaultValue={billingAddr.street || ""}
            placeholder="123 Market Street"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="City">
            <Input
              name="city"
              defaultValue={billingAddr.city || ""}
              placeholder="San Francisco"
            />
          </FormField>
          <FormField label="State / Region">
            <Input
              name="state"
              defaultValue={billingAddr.state || ""}
              placeholder="CA"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Postal Code">
            <Input
              name="postalCode"
              defaultValue={billingAddr.postalCode || ""}
              placeholder="94103"
            />
          </FormField>
          <FormField label="Country">
            <Input
              name="country"
              defaultValue={billingAddr.country || ""}
              placeholder="USA"
            />
          </FormField>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving Changes..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}

