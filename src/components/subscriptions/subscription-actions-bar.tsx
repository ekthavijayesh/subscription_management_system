"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { transitionSubscriptionAction } from "@/app/actions/subscriptions";
import type { SubscriptionAction } from "@/lib/services/subscription-state.service";

interface Props {
  subscriptionId: string;
  status: string;
}

export function SubscriptionActionsBar({ subscriptionId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAction(action: SubscriptionAction) {
    let reason: string | undefined = undefined;
    if (action === "cancel") {
      const input = prompt("Reason for cancelling subscription:");
      if (!input) return;
      reason = input;
    } else {
      if (!confirm(`Are you sure you want to ${action} this subscription?`)) return;
    }

    startTransition(async () => {
      const res = await transitionSubscriptionAction({
        subscriptionId,
        action,
        cancellationReason: reason,
      });

      if (!res.success) {
        alert(res.error ?? "Failed to perform action");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {status === "active" && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("pause")}
            disabled={isPending}
          >
            Pause
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction("cancel")}
            disabled={isPending}
          >
            Cancel Subscription
          </Button>
        </>
      )}

      {status === "paused" && (
        <>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleAction("resume")}
            disabled={isPending}
          >
            Resume
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction("cancel")}
            disabled={isPending}
          >
            Cancel Subscription
          </Button>
        </>
      )}

      {status === "past_due" && (
        <>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleAction("cure_past_due")}
            disabled={isPending}
          >
            Mark Paid / Cure
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction("cancel")}
            disabled={isPending}
          >
            Cancel Subscription
          </Button>
        </>
      )}
    </div>
  );
}
