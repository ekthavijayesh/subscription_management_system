"use client";

/**
 * QuotationForm — reusable client form for creating and editing quotation drafts.
 *
 * Used by both /staff/quotations/new and /staff/quotations/[id]/edit.
 * Calls server actions; never writes to DB directly.
 *
 * Props:
 * - mode: "create" | "edit"
 * - defaultValues: pre-populated from existing draft (edit mode)
 * - onSuccess: callback with { quotationId, quotationNumber }
 */

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createQuotationAction, updateQuotationAction } from "@/app/actions/quotations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LineItemFormValue {
  plan_id: string;
  description?: string;
  quantity: number;
  discount_code?: string;
}

export interface QuotationFormValues {
  customer_id: string;
  valid_until: string;
  currency: string;
  notes?: string;
  items: LineItemFormValue[];
}

export interface QuotationFormProps {
  mode: "create" | "edit";
  quotationId?: string;
  defaultValues?: Partial<QuotationFormValues>;
  onSuccess?: (data: { quotationId: string; quotationNumber?: string }) => void;
}

// ---------------------------------------------------------------------------
// Blank line item
// ---------------------------------------------------------------------------

const emptyItem = (): LineItemFormValue => ({
  plan_id: "",
  description: "",
  quantity: 1,
  discount_code: "",
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuotationForm({
  mode,
  quotationId,
  defaultValues,
  onSuccess,
}: QuotationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState(defaultValues?.customer_id ?? "");
  const [validUntil, setValidUntil] = useState(
    defaultValues?.valid_until
      ? defaultValues.valid_until.slice(0, 16) // "YYYY-MM-DDTHH:mm"
      : ""
  );
  const [currency, setCurrency] = useState(defaultValues?.currency ?? "USD");
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");
  const [items, setItems] = useState<LineItemFormValue[]>(
    defaultValues?.items?.length ? defaultValues.items : [emptyItem()]
  );

  // ---------------------------------------------------------------------------
  // Line item helpers
  // ---------------------------------------------------------------------------

  function updateItem(index: number, field: keyof LineItemFormValue, value: string | number) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // Build payload — valid_until must be a full ISO 8601 UTC string
    const validUntilISO = validUntil ? new Date(validUntil).toISOString() : "";

    const payload = {
      customer_id: customerId.trim(),
      valid_until: validUntilISO,
      currency: currency.trim().toUpperCase(),
      notes: notes.trim() || null,
      items: items
        .filter((item) => item.plan_id.trim())
        .map((item) => ({
          plan_id: item.plan_id.trim(),
          description: item.description?.trim() || undefined,
          quantity: Number(item.quantity),
          discount_code: item.discount_code?.trim() || undefined,
        })),
    };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createQuotationAction(payload);
        if (!result.success) {
          setFormError(result.error ?? "Failed to create quotation");
        } else {
          setSuccessMessage(
            `Quotation ${result.data?.quotationNumber} created successfully.`
          );
          onSuccess?.(result.data!);
        }
      } else {
        const result = await updateQuotationAction({
          ...payload,
          quotation_id: quotationId!,
        });
        if (!result.success) {
          setFormError(result.error ?? "Failed to update quotation");
        } else {
          setSuccessMessage("Quotation draft updated successfully.");
          onSuccess?.({ quotationId: result.data!.quotationId });
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header fields */}
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "New Quotation" : "Edit Quotation Draft"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "create" && (
            <div className="space-y-1">
              <Label htmlFor="customer_id">Customer ID (UUID)</Label>
              <Input
                id="customer_id"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                required
              />
              <p className="text-xs text-muted-foreground">
                The UUID of the customer this quotation is for.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="USD"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes for this quotation…"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-end border rounded-md p-3 bg-muted/30"
            >
              <div className="col-span-4 space-y-1">
                <Label htmlFor={`plan_id_${idx}`}>Plan ID (UUID)</Label>
                <Input
                  id={`plan_id_${idx}`}
                  value={item.plan_id}
                  onChange={(e) => updateItem(idx, "plan_id", e.target.value)}
                  placeholder="Plan UUID"
                  required
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label htmlFor={`description_${idx}`}>Description</Label>
                <Input
                  id={`description_${idx}`}
                  value={item.description ?? ""}
                  onChange={(e) => updateItem(idx, "description", e.target.value)}
                  placeholder="Optional override"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor={`quantity_${idx}`}>Qty</Label>
                <Input
                  id={`quantity_${idx}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value, 10))}
                  required
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor={`discount_code_${idx}`}>Discount Code</Label>
                <Input
                  id={`discount_code_${idx}`}
                  value={item.discount_code ?? ""}
                  onChange={(e) =>
                    updateItem(idx, "discount_code", e.target.value.toUpperCase())
                  }
                  placeholder="SUMMER20"
                />
              </div>
              <div className="col-span-1 flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  aria-label="Remove line item"
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addItem} className="w-full">
            + Add Line Item
          </Button>
        </CardContent>
      </Card>

      {/* Errors / Success */}
      {formError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          {successMessage}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending
          ? mode === "create"
            ? "Creating…"
            : "Saving…"
          : mode === "create"
          ? "Create Quotation Draft"
          : "Save Changes"}
      </Button>
    </form>
  );
}
