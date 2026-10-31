"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { transitionQuotationAction, convertQuotationAction } from "@/app/actions/quotations";
import type { QuotationAction } from "@/lib/services/quotation-state.service";

interface Props {
  quotationId: string;
  status: string;
  userRole: "admin" | "staff" | "customer";
}

export function QuotationActionsBar({ quotationId, status, userRole }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAction(action: QuotationAction) {
    if (!confirm(`Are you sure you want to ${action} this quotation?`)) return;

    startTransition(async () => {
      const res = await transitionQuotationAction({ quotationId, action });
      if (!res.success) {
        alert(res.error ?? "Failed to perform action");
      } else {
        router.refresh();
      }
    });
  }

  function handleConvert() {
    if (!confirm("Convert this approved quotation into an active subscription?")) return;

    startTransition(async () => {
      const res = await convertQuotationAction({ quotationId });
      if (!res.success) {
        alert(res.error ?? "Failed to convert quotation");
      } else {
        alert(`Successfully converted! Subscription: ${res.data?.subscriptionNumber}`);
        router.refresh();
      }
    });
  }

  const isStaffOrAdmin = userRole === "admin" || userRole === "staff";

  return (
    <div className="flex items-center gap-2">
      {status === "draft" && isStaffOrAdmin && (
        <>
          <Button
            size="sm"
            onClick={() => handleAction("send")}
            disabled={isPending}
          >
            Send Quotation
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction("cancel")}
            disabled={isPending}
          >
            Cancel Draft
          </Button>
        </>
      )}

      {status === "sent" && (
        <>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleAction("approve")}
            disabled={isPending}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("reject")}
            disabled={isPending}
          >
            Reject
          </Button>
          {isStaffOrAdmin && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleAction("cancel")}
              disabled={isPending}
            >
              Cancel Quote
            </Button>
          )}
        </>
      )}

      {status === "approved" && isStaffOrAdmin && (
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={handleConvert}
          disabled={isPending}
        >
          Convert to Subscription
        </Button>
      )}
    </div>
  );
}
