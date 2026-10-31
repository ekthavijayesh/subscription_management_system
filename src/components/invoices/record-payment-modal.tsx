"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recordPaymentAction } from "@/app/actions/payments";

interface Props {
  invoiceId: string;
  currency: string;
  amountDue: string;
}

export function RecordPaymentModal({ invoiceId, currency, amountDue }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(amountDue);
  const [method, setMethod] = useState<
    "credit_card" | "bank_transfer" | "cash" | "manual" | "other"
  >("bank_transfer");
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (amountDue === "0.00") return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await recordPaymentAction({
        invoiceId,
        amount,
        paymentMethod: method,
        providerTransactionId: ref || undefined,
        notes: notes || undefined,
      });

      if (!res.success) {
        setError(res.error ?? "Failed to record payment");
      } else {
        alert(
          `Payment ${res.data?.payment.payment_number} recorded! Remaining due: ${currency} ${res.data?.updatedInvoice.amount_due}`
        );
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  if (!isOpen) {
    return (
      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsOpen(true)}>
        Record Payment
      </Button>
    );
  }

  return (
    <Card className="border-emerald-500/40 bg-emerald-50/10 mt-4">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold">Record Payment for Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="payment_amount" className="text-xs">
                Amount ({currency})
              </Label>
              <Input
                id="payment_amount"
                type="number"
                step="0.01"
                min="0.01"
                max={amountDue}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="payment_method" className="text-xs">
                Method
              </Label>
              <Select
                id="payment_method"
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card (Manual/POS)</option>
                <option value="cash">Cash</option>
                <option value="manual">Manual Check / Wire</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="payment_ref" className="text-xs">
              Transaction / Check Reference
            </Label>
            <Input
              id="payment_ref"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. WIRE-884291 or CHK-1092"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="payment_notes" className="text-xs">
              Internal Notes
            </Label>
            <Input
              id="payment_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Received via wire on Friday..."
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isPending}
            >
              {isPending ? "Recording..." : "Confirm Payment"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
