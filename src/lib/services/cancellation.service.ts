/**
 * TASK-041 — Cancellation Requests Service
 *
 * Implements customer-initiated cancellation workflow:
 * - Customers submit a cancellation request (with mandatory reason).
 * - Staff/admin view pending requests and make decisions (approve/reject).
 * - Upon approval:
 *   - The cancellation request status is set to 'approved'.
 *   - The subscription is updated (either set to cancel at period end, or cancelled immediately).
 *   - An audit event is added to `subscription_events`.
 *   - The customer receives an in-app notification with decision notes.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface CancellationRequestRecord {
  id: string;
  subscription_id: string;
  customer_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  decision_by: string | null;
  decision_notes: string | null;
  effective_date: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export class CancellationError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "ALREADY_DECIDED"
      | "SUBSCRIPTION_INACTIVE"
      | "VALIDATION_ERROR",
    message: string
  ) {
    super(message);
    this.name = "CancellationError";
  }
}

export async function requestCancellation(params: {
  subscriptionId: string;
  customerId: string;
  reason: string;
}): Promise<CancellationRequestRecord> {
  const supabase = createClient();

  // 1. Verify subscription exists, belongs to the customer, and is active
  const { data: rawSub, error: subError } = await supabase
    .from("subscriptions")
    .select("id, customer_id, status")
    .eq("id", params.subscriptionId)
    .single();

  const subscription = rawSub as { id: string; customer_id: string; status: string } | null;

  if (subError || !subscription) {
    throw new CancellationError("NOT_FOUND", `Subscription ${params.subscriptionId} not found`);
  }

  if (subscription.customer_id !== params.customerId) {
    throw new CancellationError(
      "FORBIDDEN",
      "You are not authorized to cancel this subscription."
    );
  }

  if (subscription.status === "cancelled" || subscription.status === "expired") {
    throw new CancellationError(
      "SUBSCRIPTION_INACTIVE",
      `Subscription is already ${subscription.status}.`
    );
  }

  // 2. Check if a pending request already exists for this subscription
  const { data: existingPending } = await supabase
    .from("cancellation_requests")
    .select("id")
    .eq("subscription_id", params.subscriptionId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPending) {
    throw new CancellationError(
      "ALREADY_DECIDED",
      "A cancellation request for this subscription is already pending review."
    );
  }

  // 3. Create cancellation request
  const { data: reqData, error: reqError } = await (supabase
    .from("cancellation_requests") as any)
    .insert({
      subscription_id: params.subscriptionId,
      customer_id: params.customerId,
      reason: params.reason.trim(),
      status: "pending",
    })
    .select()
    .single();

  if (reqError || !reqData) {
    throw new Error(`Failed to submit cancellation request: ${reqError?.message ?? "unknown error"}`);
  }

  // 4. Record event
  try {
    await (supabase.from("subscription_events") as any).insert({
      subscription_id: params.subscriptionId,
      event_type: "cancellation_requested",
      actor_id: params.customerId,
      metadata: { reason: params.reason },
    });
  } catch (err) {
    console.error("Non-fatal event logging error:", err);
  }

  return reqData as unknown as CancellationRequestRecord;
}

export async function decideCancellationRequest(params: {
  requestId: string;
  decision: "approved" | "rejected";
  decisionNotes?: string;
  decisionBy: string;
  cancelImmediately?: boolean;
}): Promise<CancellationRequestRecord> {
  const supabase = createClient();

  // 1. Fetch request
  const { data: rawReq, error: reqError } = await supabase
    .from("cancellation_requests")
    .select("*")
    .eq("id", params.requestId)
    .single();

  const req = rawReq as unknown as CancellationRequestRecord;

  if (reqError || !req) {
    throw new CancellationError("NOT_FOUND", `Cancellation request ${params.requestId} not found`);
  }

  if (req.status !== "pending") {
    throw new CancellationError(
      "ALREADY_DECIDED",
      `Request has already been ${req.status}.`
    );
  }

  const now = new Date().toISOString();

  // 2. Update request
  const { data: updatedReq, error: updateError } = await (supabase
    .from("cancellation_requests") as any)
    .update({
      status: params.decision,
      decision_by: params.decisionBy,
      decision_notes: params.decisionNotes ?? null,
      decided_at: now,
      effective_date: params.decision === "approved" ? now : null,
    })
    .eq("id", params.requestId)
    .select()
    .single();

  if (updateError || !updatedReq) {
    throw new Error(`Failed to update cancellation request: ${updateError?.message ?? "unknown"}`);
  }

  // 3. If approved, apply cancellation to the subscription
  if (params.decision === "approved") {
    const subUpdate = params.cancelImmediately
      ? {
          status: "cancelled",
          cancelled_at: now,
          cancellation_reason: req.reason,
          auto_renew: false,
        }
      : {
          cancel_at_period_end: true,
          auto_renew: false,
          cancellation_reason: req.reason,
        };

    await (supabase.from("subscriptions") as any)
      .update(subUpdate)
      .eq("id", req.subscription_id);

    // Event
    try {
      await (supabase.from("subscription_events") as any).insert({
        subscription_id: req.subscription_id,
        event_type: params.cancelImmediately
          ? "subscription_cancelled"
          : "subscription_set_to_cancel_at_period_end",
        actor_id: params.decisionBy,
        metadata: {
          request_id: req.id,
          decision_notes: params.decisionNotes,
        },
      });
    } catch (err) {
      console.error("Non-fatal event logging error:", err);
    }
  }

  // 4. Notify customer
  try {
    await (supabase.from("notifications") as any).insert({
      recipient_id: req.customer_id,
      title: `Cancellation Request ${params.decision.toUpperCase()}`,
      message: `Your cancellation request was ${params.decision}.${
        params.decisionNotes ? ` Notes: ${params.decisionNotes}` : ""
      }`,
      channel: "in_app",
      status: "unread",
      metadata: { request_id: req.id, decision: params.decision },
    });
  } catch (err) {
    console.error("Non-fatal notification error:", err);
  }

  return updatedReq as unknown as CancellationRequestRecord;
}

export async function listCancellationRequests(params?: {
  subscriptionId?: string;
  customerId?: string;
  status?: string;
}): Promise<CancellationRequestRecord[]> {
  const supabase = createClient();
  let query = supabase
    .from("cancellation_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (params?.subscriptionId) query = query.eq("subscription_id", params.subscriptionId);
  if (params?.customerId) query = query.eq("customer_id", params.customerId);
  if (params?.status) query = query.eq("status", params.status);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list cancellation requests: ${error.message}`);
  }

  return (data as unknown as CancellationRequestRecord[]) ?? [];
}
