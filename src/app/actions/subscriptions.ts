"use server";

/**
 * TASK-040 — Subscription Server Actions
 */

import { requireRole } from "@/lib/auth/authorization";
import {
  transitionSubscriptionStatus,
  getSubscriptionById,
  listSubscriptions,
  type SubscriptionRecord,
  type SubscriptionDetail,
  type ListSubscriptionsFilter,
} from "@/lib/services/subscription.service";
import {
  SubscriptionStateError,
  type SubscriptionAction,
} from "@/lib/services/subscription-state.service";

export interface SubscriptionActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function transitionSubscriptionAction(params: {
  subscriptionId: string;
  action: SubscriptionAction;
  cancellationReason?: string;
}): Promise<SubscriptionActionResult<{ subscriptionId: string; newStatus: string }>> {
  try {
    const session = await requireRole(["staff", "admin"]);

    const updated = await transitionSubscriptionStatus({
      subscriptionId: params.subscriptionId,
      action: params.action,
      actorId: session.user.id,
      actorRole: session.profile.role as "admin" | "staff",
      cancellationReason: params.cancellationReason,
    });

    return {
      success: true,
      data: {
        subscriptionId: updated.id,
        newStatus: updated.status,
      },
    };
  } catch (err) {
    if (err instanceof SubscriptionStateError) {
      return {
        success: false,
        error: err.message,
        errorCode: err.code,
      };
    }
    const message = err instanceof Error ? err.message : "Unexpected error transitioning subscription";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}

export async function getSubscriptionAction(
  subscriptionId: string
): Promise<SubscriptionActionResult<SubscriptionDetail>> {
  try {
    await requireRole(["staff", "admin", "customer"]);
    const sub = await getSubscriptionById(subscriptionId);
    if (!sub) {
      return { success: false, error: "Subscription not found", errorCode: "NOT_FOUND" };
    }
    return { success: true, data: sub };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}

export async function listSubscriptionsAction(
  filter: ListSubscriptionsFilter = {}
): Promise<SubscriptionActionResult<{ subscriptions: SubscriptionRecord[]; total: number }>> {
  try {
    await requireRole(["staff", "admin", "customer"]);
    const res = await listSubscriptions(filter);
    return { success: true, data: res };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}
