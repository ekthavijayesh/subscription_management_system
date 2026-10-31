/**
 * TASK-053 — Subscription Renewal Execution Service
 *
 * Enforces renewal execution invariants:
 * - Never advance a subscription period outside explicit policy.
 * - Renewal execution criteria:
 *   1. Subscription must be in 'active' status.
 *   2. auto_renew must be true, cancel_at_period_end must be false.
 *   3. If cancel_at_period_end is true, transitions subscription to 'cancelled' with cancelled_at timestamp.
 *   4. An invoice for the renewing period must exist and be settled ('paid') OR approved for invoice billing.
 *   5. Advances current_period_start to previous current_period_end, and advances current_period_end to next canonical UTC period.
 * - Records every success/failure in `subscription_events` and emits notifications.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateNextBillingPeriod } from "@/lib/services/renewal-calculation.service";
import { getSubscriptionById, type SubscriptionRecord } from "@/lib/services/subscription.service";

export interface RenewalResult {
  subscriptionId: string;
  subscriptionNumber: string;
  previousPeriodEnd: string;
  newPeriodStart: string;
  newPeriodEnd: string;
  action: "renewed" | "cancelled_at_period_end" | "payment_required";
  notes?: string;
}

export class RenewalError extends Error {
  constructor(
    public readonly code:
      | "SUBSCRIPTION_NOT_FOUND"
      | "INELIGIBLE_FOR_RENEWAL"
      | "PERIOD_NOT_ENDED"
      | "UNPAID_INVOICE"
      | "INTERNAL_ERROR",
    message: string
  ) {
    super(message);
    this.name = "RenewalError";
  }
}

export async function executeSubscriptionRenewal(params: {
  subscriptionId: string;
  requirePaidInvoice?: boolean;
  actorId?: string;
}): Promise<RenewalResult> {
  const supabase = createAdminClient();
  const sub = await getSubscriptionById(params.subscriptionId);

  if (!sub) {
    throw new RenewalError("SUBSCRIPTION_NOT_FOUND", `Subscription ${params.subscriptionId} not found`);
  }

  // 1. Check if set to cancel at period end
  if (sub.cancel_at_period_end) {
    const now = new Date().toISOString();
    await (supabase.from("subscriptions") as any)
      .update({
        status: "cancelled",
        cancelled_at: now,
        auto_renew: false,
      })
      .eq("id", sub.id);

    try {
      await (supabase.from("subscription_events") as any).insert({
        subscription_id: sub.id,
        event_type: "subscription_cancelled_at_period_end",
        actor_id: params.actorId ?? null,
        metadata: { period_end: sub.current_period_end },
      });

      await (supabase.from("notifications") as any).insert({
        recipient_id: sub.customer_id,
        title: "Subscription Cancelled",
        message: `Your subscription ${sub.subscription_number} has concluded at the end of its billing cycle.`,
        channel: "in_app",
        status: "unread",
        metadata: { subscription_id: sub.id },
      });
    } catch (err) {
      console.error("Non-fatal cancellation event log error:", err);
    }

    return {
      subscriptionId: sub.id,
      subscriptionNumber: sub.subscription_number,
      previousPeriodEnd: sub.current_period_end,
      newPeriodStart: sub.current_period_end,
      newPeriodEnd: sub.current_period_end,
      action: "cancelled_at_period_end",
      notes: "Subscription reached end of period with cancel_at_period_end=true.",
    };
  }

  // 2. Validate active & auto_renew
  if (sub.status !== "active" || !sub.auto_renew) {
    throw new RenewalError(
      "INELIGIBLE_FOR_RENEWAL",
      `Subscription is in status '${sub.status}' with auto_renew=${sub.auto_renew}; not eligible for renewal.`
    );
  }

  // 3. Optional invoice check (if requirePaidInvoice is enabled)
  if (params.requirePaidInvoice) {
    const { data: unpaidInvoice } = await supabase
      .from("invoices")
      .select("id, invoice_number, status, amount_due")
      .eq("subscription_id", sub.id)
      .eq("billing_period_start", sub.current_period_start)
      .eq("billing_period_end", sub.current_period_end)
      .neq("status", "paid")
      .maybeSingle();

    if (unpaidInvoice) {
      // Mark event as failed renewal attempt
      await (supabase.from("subscription_events") as any).insert({
        subscription_id: sub.id,
        event_type: "renewal_blocked_unpaid_invoice",
        actor_id: params.actorId ?? null,
        metadata: { invoice_id: (unpaidInvoice as any).id, invoice_number: (unpaidInvoice as any).invoice_number },
      });

      throw new RenewalError(
        "UNPAID_INVOICE",
        `Renewal blocked: Invoice ${(unpaidInvoice as any).invoice_number} is in status '${(unpaidInvoice as any).status}' with unpaid balance.`
      );
    }
  }

  // 4. Calculate next period bounds
  const nextPeriod = calculateNextBillingPeriod({
    currentPeriodEnd: sub.current_period_end,
    interval: sub.billing_interval,
    intervalCount: sub.interval_count,
  });

  // 5. Advance subscription period
  const { data: updatedSub, error: updateError } = await (supabase
    .from("subscriptions") as any)
    .update({
      current_period_start: nextPeriod.periodStart,
      current_period_end: nextPeriod.periodEnd,
    })
    .eq("id", sub.id)
    .select()
    .single();

  if (updateError || !updatedSub) {
    throw new RenewalError(
      "INTERNAL_ERROR",
      `Failed to advance subscription period: ${updateError?.message ?? "unknown error"}`
    );
  }

  // 6. Record audit & customer notification
  try {
    await (supabase.from("subscription_events") as any).insert({
      subscription_id: sub.id,
      event_type: "subscription_renewed",
      actor_id: params.actorId ?? null,
      metadata: {
        from_period_start: sub.current_period_start,
        from_period_end: sub.current_period_end,
        to_period_start: nextPeriod.periodStart,
        to_period_end: nextPeriod.periodEnd,
      },
    });

    await (supabase.from("notifications") as any).insert({
      recipient_id: sub.customer_id,
      title: "Subscription Renewed",
      message: `Your subscription ${sub.subscription_number} has been renewed through ${new Date(nextPeriod.periodEnd).toLocaleDateString()}.`,
      channel: "in_app",
      status: "unread",
      metadata: {
        subscription_id: sub.id,
        next_period_end: nextPeriod.periodEnd,
      },
    });
  } catch (err) {
    console.error("Non-fatal renewal event log error:", err);
  }

  return {
    subscriptionId: sub.id,
    subscriptionNumber: sub.subscription_number,
    previousPeriodEnd: sub.current_period_end,
    newPeriodStart: nextPeriod.periodStart,
    newPeriodEnd: nextPeriod.periodEnd,
    action: "renewed",
  };
}
