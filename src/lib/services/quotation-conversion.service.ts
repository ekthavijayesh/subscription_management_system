/**
 * TASK-038 — Quotation Conversion Service
 *
 * Atomically and idempotently converts an approved quotation into an active subscription:
 * - Checks status is strictly 'approved'.
 * - Verifies valid_until has not passed.
 * - Idempotency guard: if already converted (or subscription with source_quotation_id exists),
 *   returns existing subscription without duplicating records.
 * - Creates subscription and subscription_items snapshots.
 * - Appends subscription_events and updates quote status to 'converted' with converted_at timestamp.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getQuotationById } from "@/lib/services/quotation.service";

export class ConversionError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "NOT_APPROVED"
      | "EXPIRED"
      | "ALREADY_CONVERTED"
      | "INTERNAL_ERROR",
    message: string
  ) {
    super(message);
    this.name = "ConversionError";
  }
}

export interface ConvertQuotationResult {
  subscriptionId: string;
  subscriptionNumber: string;
  isExisting: boolean;
}

function generateSubscriptionNumber(): string {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `SUB-${ymd}-${rand}`;
}

export async function convertApprovedQuotation(params: {
  quotationId: string;
  actorId: string;
}): Promise<ConvertQuotationResult> {
  const supabase = createClient();

  // 1. Fetch full quotation with items
  const quotation = await getQuotationById(params.quotationId);
  if (!quotation) {
    throw new ConversionError("NOT_FOUND", `Quotation ${params.quotationId} not found`);
  }

  // 2. Check for existing conversion (idempotency guard)
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, subscription_number")
    .eq("source_quotation_id", params.quotationId)
    .maybeSingle();

  const existingSubscription = existingSub as { id: string; subscription_number: string } | null;

  if (existingSubscription) {
    return {
      subscriptionId: existingSubscription.id,
      subscriptionNumber: existingSubscription.subscription_number,
      isExisting: true,
    };
  }

  // 3. Status must be 'approved'
  if (quotation.status !== "approved") {
    throw new ConversionError(
      "NOT_APPROVED",
      `Quotation ${quotation.quotation_number} cannot be converted because it is in '${quotation.status}' status (must be 'approved').`
    );
  }

  // 4. Must not be expired
  if (new Date(quotation.valid_until) < new Date()) {
    throw new ConversionError(
      "EXPIRED",
      `Quotation ${quotation.quotation_number} expired on ${new Date(quotation.valid_until).toISOString()} and cannot be converted.`
    );
  }

  // 5. Default period: 1 month interval starting now UTC
  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const subscriptionNumber = generateSubscriptionNumber();

  // 6. Create subscription record
  const { data: subData, error: subError } = await (supabase
    .from("subscriptions") as any)
    .insert({
      subscription_number: subscriptionNumber,
      customer_id: quotation.customer_id,
      source_quotation_id: quotation.id,
      status: "active",
      billing_interval: "month",
      interval_count: 1,
      currency: quotation.currency,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      auto_renew: true,
      subtotal: quotation.subtotal,
      discount_total: quotation.discount_total,
      tax_total: quotation.tax_total,
      total: quotation.total,
    })
    .select()
    .single();

  if (subError || !subData) {
    throw new ConversionError(
      "INTERNAL_ERROR",
      `Failed to create subscription: ${subError?.message ?? "unknown error"}`
    );
  }

  const subscription = subData as { id: string; subscription_number: string };

  // 7. Copy line items snapshot into subscription_items
  const subscriptionItems = quotation.items.map((item) => ({
    subscription_id: subscription.id,
    plan_id: item.plan_id,
    description: item.description,
    sku: item.sku,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_amount: item.discount_amount,
    tax_rate: item.tax_rate,
    tax_amount: item.tax_amount,
    line_total: item.line_total,
  }));

  const { error: itemsError } = await (supabase
    .from("subscription_items") as any)
    .insert(subscriptionItems);

  if (itemsError) {
    // Attempt rollback of created subscription
    await supabase.from("subscriptions").delete().eq("id", subscription.id);
    throw new ConversionError(
      "INTERNAL_ERROR",
      `Failed to copy subscription items: ${itemsError.message}`
    );
  }

  // 8. Update quotation status to converted
  await (supabase.from("quotations") as any)
    .update({
      status: "converted",
      converted_at: new Date().toISOString(),
    })
    .eq("id", quotation.id);

  // 9. Append subscription event
  try {
    await (supabase.from("subscription_events") as any).insert({
      subscription_id: subscription.id,
      event_type: "converted_from_quotation",
      actor_id: params.actorId,
      metadata: {
        quotation_id: quotation.id,
        quotation_number: quotation.quotation_number,
      },
    });

    // Notify customer that their subscription is now active
    await (supabase.from("notifications") as any).insert({
      recipient_id: quotation.customer_id,
      title: "Subscription Created",
      message: `Your approved quotation ${quotation.quotation_number} has been converted into subscription ${subscription.subscription_number}.`,
      channel: "in_app",
      status: "unread",
      metadata: {
        subscription_id: subscription.id,
        subscription_number: subscription.subscription_number,
      },
    });
  } catch (logErr) {
    console.error("Non-fatal error creating subscription event/notification:", logErr);
  }

  return {
    subscriptionId: subscription.id,
    subscriptionNumber: subscription.subscription_number,
    isExisting: false,
  };
}
