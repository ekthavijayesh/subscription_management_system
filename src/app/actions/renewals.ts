"use server";

/**
 * TASK-053 — Subscription Renewal Action
 */

import { requireRole } from "@/lib/auth/authorization";
import {
  executeSubscriptionRenewal,
  RenewalError,
  type RenewalResult,
} from "@/lib/services/renewal-execution.service";

export interface RenewalActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function executeRenewalAction(params: {
  subscriptionId: string;
  requirePaidInvoice?: boolean;
}): Promise<RenewalActionResult<RenewalResult>> {
  try {
    const session = await requireRole(["staff", "admin"]);

    const res = await executeSubscriptionRenewal({
      ...params,
      actorId: session.user.id,
    });

    return {
      success: true,
      data: res,
    };
  } catch (err) {
    if (err instanceof RenewalError) {
      return {
        success: false,
        error: err.message,
        errorCode: err.code,
      };
    }
    const message = err instanceof Error ? err.message : "Failed to execute renewal";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}
