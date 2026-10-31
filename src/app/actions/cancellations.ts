"use server";

/**
 * TASK-041 — Cancellation Request Server Actions
 */

import { requireAuth, requireRole } from "@/lib/auth/authorization";
import {
  requestCancellation,
  decideCancellationRequest,
  listCancellationRequests,
  CancellationError,
  type CancellationRequestRecord,
} from "@/lib/services/cancellation.service";

export interface CancellationActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function requestCancellationAction(params: {
  subscriptionId: string;
  reason: string;
}): Promise<CancellationActionResult<{ requestId: string }>> {
  try {
    const session = await requireAuth();

    if (!params.reason || params.reason.trim().length < 5) {
      return {
        success: false,
        error: "Please provide a valid cancellation reason (at least 5 characters).",
        errorCode: "VALIDATION_ERROR",
      };
    }

    const req = await requestCancellation({
      subscriptionId: params.subscriptionId,
      customerId: session.user.id,
      reason: params.reason,
    });

    return {
      success: true,
      data: { requestId: req.id },
    };
  } catch (err) {
    if (err instanceof CancellationError) {
      return { success: false, error: err.message, errorCode: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to submit cancellation request";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}

export async function decideCancellationAction(params: {
  requestId: string;
  decision: "approved" | "rejected";
  decisionNotes?: string;
  cancelImmediately?: boolean;
}): Promise<CancellationActionResult<{ requestId: string; decision: string }>> {
  try {
    const session = await requireRole(["staff", "admin"]);

    const req = await decideCancellationRequest({
      requestId: params.requestId,
      decision: params.decision,
      decisionNotes: params.decisionNotes,
      decisionBy: session.user.id,
      cancelImmediately: params.cancelImmediately,
    });

    return {
      success: true,
      data: { requestId: req.id, decision: req.status },
    };
  } catch (err) {
    if (err instanceof CancellationError) {
      return { success: false, error: err.message, errorCode: err.code };
    }
    const message = err instanceof Error ? err.message : "Failed to process decision";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}

export async function listCancellationRequestsAction(params?: {
  subscriptionId?: string;
  status?: string;
}): Promise<CancellationActionResult<CancellationRequestRecord[]>> {
  try {
    await requireRole(["staff", "admin"]);
    const requests = await listCancellationRequests(params);
    return { success: true, data: requests };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load cancellation requests";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}
