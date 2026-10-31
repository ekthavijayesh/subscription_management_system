"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestCancellationAction } from "@/app/actions/cancellations";

interface Props {
  subscriptionId: string;
  isCancelledOrPending?: boolean;
}

export function CustomerCancellationForm({ subscriptionId, isCancelledOrPending }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (isCancelledOrPending) {
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await requestCancellationAction({ subscriptionId, reason });
      if (!res.success) {
        setError(res.error ?? "Failed to submit cancellation request");
      } else {
        alert("Your cancellation request has been submitted for review.");
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Request Cancellation
      </Button>
    );
  }

  return (
    <Card className="border-destructive/40 bg-destructive/5 mt-4">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold text-destructive">
          Request Subscription Cancellation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="cancel_reason" className="text-xs">
              Reason for Cancellation
            </Label>
            <Input
              id="cancel_reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Budget constraints, no longer needed..."
              required
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isPending}
            >
              {isPending ? "Submitting..." : "Submit Request"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Dismiss
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
