"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { decideCancellationAction } from "@/app/actions/cancellations";

interface Props {
  requestId: string;
}

export function CancellationDecisionButtons({ requestId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDecision(decision: "approved" | "rejected") {
    const notes = prompt(`Optional decision notes for ${decision}:`) ?? undefined;
    const cancelImmediately = decision === "approved" ? confirm("Cancel immediately (OK) or at period end (Cancel)?") : false;

    startTransition(async () => {
      const res = await decideCancellationAction({
        requestId,
        decision,
        decisionNotes: notes,
        cancelImmediately,
      });

      if (!res.success) {
        alert(res.error ?? "Failed to process decision");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex gap-2 justify-end">
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700"
        onClick={() => handleDecision("approved")}
        disabled={isPending}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleDecision("rejected")}
        disabled={isPending}
      >
        Reject
      </Button>
    </div>
  );
}
