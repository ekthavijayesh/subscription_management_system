/**
 * TASK-039 — Subscription Service (Data & Role-Scoped Views)
 *
 * Provides query and read contracts for subscriptions:
 * - listSubscriptions: RLS-enforced and role-scoped subscription list with filtering and pagination.
 * - getSubscriptionById: Single subscription details with its items and event history.
 *
 * Role scoping is naturally enforced by Supabase RLS policies:
 * - Customers only see subscriptions where customer_id = auth.uid()
 * - Staff only see subscriptions for assigned customers (or all if admin)
 * - Admin sees all subscriptions
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface SubscriptionRecord {
  id: string;
  subscription_number: string;
  customer_id: string;
  source_quotation_id: string | null;
  status: "active" | "paused" | "past_due" | "cancelled" | "expired";
  billing_interval: "month" | "year" | "week" | "quarter";
  interval_count: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  total: string;
  cancelled_at: string | null;
  cancel_at_period_end: boolean;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionItemRecord {
  id: string;
  subscription_id: string;
  plan_id: string | null;
  product_id: string | null;
  variant_id: string | null;
  description: string;
  sku: string | null;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  line_total: string;
}

export interface SubscriptionEventRecord {
  id: string;
  subscription_id: string;
  event_type: string;
  actor_id: string | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
}

export interface SubscriptionDetail extends SubscriptionRecord {
  items: SubscriptionItemRecord[];
  events: SubscriptionEventRecord[];
}

export interface ListSubscriptionsFilter {
  customerId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function listSubscriptions(
  filter: ListSubscriptionsFilter = {}
): Promise<{ subscriptions: SubscriptionRecord[]; total: number }> {
  const supabase = createClient();
  const limit = filter.limit ?? 20;
  const offset = filter.offset ?? 0;

  let query = supabase
    .from("subscriptions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.customerId) {
    query = query.eq("customer_id", filter.customerId);
  }
  if (filter.status) {
    query = query.eq("status", filter.status as any);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list subscriptions: ${error.message}`);
  }

  return {
    subscriptions: (data as unknown as SubscriptionRecord[]) ?? [],
    total: count ?? 0,
  };
}

export async function getSubscriptionById(
  subscriptionId: string
): Promise<SubscriptionDetail | null> {
  const supabase = createClient();

  // 1. Fetch subscription header
  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (subError || !subData) return null;
  const subscription = subData as unknown as SubscriptionRecord;

  // 2. Fetch subscription line items
  const { data: itemsData, error: itemsError } = await supabase
    .from("subscription_items")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: true });

  if (itemsError) return null;
  const items = (itemsData as unknown as SubscriptionItemRecord[]) ?? [];

  // 3. Fetch audit / events
  const { data: eventsData } = await supabase
    .from("subscription_events")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("occurred_at", { ascending: false });

  const events = (eventsData as unknown as SubscriptionEventRecord[]) ?? [];

  return {
    ...subscription,
    items,
    events,
  };
}


// ---------------------------------------------------------------------------
// Transition subscription status (TASK-040)
// ---------------------------------------------------------------------------

import {
  validateSubscriptionTransition,
  type SubscriptionAction,
  type SubscriptionStatus,
  SubscriptionStateError,
} from "@/lib/services/subscription-state.service";

export async function transitionSubscriptionStatus(params: {
  subscriptionId: string;
  action: SubscriptionAction;
  actorId: string;
  actorRole: "admin" | "staff" | "customer";
  cancellationReason?: string;
}): Promise<SubscriptionRecord> {
  const supabase = createClient();

  const { data: rawSub, error: fetchError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", params.subscriptionId)
    .single();

  const subscription = rawSub as unknown as SubscriptionRecord;

  if (fetchError || !subscription) {
    throw new SubscriptionStateError(
      "NOT_FOUND",
      `Subscription ${params.subscriptionId} not found`
    );
  }

  const { nextStatus } = validateSubscriptionTransition({
    currentStatus: subscription.status,
    action: params.action,
    userRole: params.actorRole,
  });

  const updatePayload: Record<string, unknown> = {
    status: nextStatus,
  };

  if (nextStatus === "cancelled") {
    updatePayload.cancelled_at = new Date().toISOString();
    if (params.cancellationReason) {
      updatePayload.cancellation_reason = params.cancellationReason;
    }
  }

  const { data: updatedData, error: updateError } = await (supabase
    .from("subscriptions") as any)
    .update(updatePayload)
    .eq("id", params.subscriptionId)
    .select()
    .single();

  if (updateError || !updatedData) {
    throw new Error(
      `Failed to update subscription status: ${updateError?.message ?? "unknown error"}`
    );
  }

  // Record event and audit
  try {
    await (supabase.from("subscription_events") as any).insert({
      subscription_id: subscription.id,
      event_type: `subscription_${params.action}`,
      actor_id: params.actorId,
      metadata: {
        from: subscription.status,
        to: nextStatus,
        reason: params.cancellationReason,
      },
    });

    await (supabase.from("notifications") as any).insert({
      recipient_id: subscription.customer_id,
      title: `Subscription ${subscription.subscription_number} Updated`,
      message: `Your subscription status has changed to '${nextStatus}'.`,
      channel: "in_app",
      status: "unread",
      metadata: {
        subscription_id: subscription.id,
        status: nextStatus,
      },
    });
  } catch (err) {
    console.error("Non-fatal error logging subscription event:", err);
  }

  return updatedData as unknown as SubscriptionRecord;
}
