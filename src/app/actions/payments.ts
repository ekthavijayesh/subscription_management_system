"use server";

/**
 * TASK-047 — Payment Server Actions
 */

import { requireRole } from "@/lib/auth/authorization";
import {
  recordPayment,
  PaymentError,
  type PaymentRecord,
} from "@/lib/services/payment.service";
import type { InvoiceRecord } from "@/lib/services/invoicing.service";

export interface PaymentActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function recordPaymentAction(params: {
  invoiceId: string;
  amount: string;
  paymentMethod: "credit_card" | "bank_transfer" | "cash" | "manual" | "other";
  providerTransactionId?: string;
  notes?: string;
}): Promise<
  PaymentActionResult<{ payment: PaymentRecord; updatedInvoice: InvoiceRecord }>
> {
  try {
    const session = await requireRole(["staff", "admin"]);

    const res = await recordPayment({
      ...params,
      actorId: session.user.id,
    });

    return {
      success: true,
      data: res,
    };
  } catch (err) {
    if (err instanceof PaymentError) {
      return {
        success: false,
        error: err.message,
        errorCode: err.code,
      };
    }
    const message = err instanceof Error ? err.message : "Failed to record payment";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}


// ---------------------------------------------------------------------------
// Payment Read Actions (TASK-049)
// ---------------------------------------------------------------------------

import {
  listPayments,
  getPaymentById,
  type ListPaymentsFilter,
} from "@/lib/services/payment.service";
import { requireAuth } from "@/lib/auth/authorization";

export async function listPaymentsAction(
  filter: ListPaymentsFilter = {}
): Promise<PaymentActionResult<{ payments: PaymentRecord[]; total: number }>> {
  try {
    await requireAuth();
    const res = await listPayments(filter);
    return { success: true, data: res };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list payments";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}

export async function getPaymentAction(
  paymentId: string
): Promise<PaymentActionResult<PaymentRecord>> {
  try {
    await requireAuth();
    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return { success: false, error: "Payment not found", errorCode: "NOT_FOUND" };
    }
    return { success: true, data: payment };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load payment";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}
