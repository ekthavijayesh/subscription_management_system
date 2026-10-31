"use server";

/**
 * TASK-043 — Invoicing Server Actions
 */

import { requireRole } from "@/lib/auth/authorization";
import {
  generateSubscriptionInvoice,
  InvoicingError,
  type InvoiceRecord,
} from "@/lib/services/invoicing.service";

export interface InvoicingActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function generateInvoiceAction(params: {
  subscriptionId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate?: string;
}): Promise<InvoicingActionResult<{ invoice: InvoiceRecord; isExisting: boolean }>> {
  try {
    const session = await requireRole(["staff", "admin"]);

    const res = await generateSubscriptionInvoice({
      ...params,
      actorId: session.user.id,
    });

    return {
      success: true,
      data: res,
    };
  } catch (err) {
    if (err instanceof InvoicingError) {
      return {
        success: false,
        error: err.message,
        errorCode: err.code,
      };
    }
    const message = err instanceof Error ? err.message : "Failed to generate invoice";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}


// ---------------------------------------------------------------------------
// Invoice Read Actions (TASK-044)
// ---------------------------------------------------------------------------

import {
  listInvoices,
  getInvoiceById,
  type InvoiceDetail,
  type ListInvoicesFilter,
} from "@/lib/services/invoicing.service";
import { requireAuth } from "@/lib/auth/authorization";

export async function getInvoiceAction(
  invoiceId: string
): Promise<InvoicingActionResult<InvoiceDetail>> {
  try {
    await requireAuth();
    const inv = await getInvoiceById(invoiceId);
    if (!inv) {
      return { success: false, error: "Invoice not found", errorCode: "NOT_FOUND" };
    }
    return { success: true, data: inv };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load invoice";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}

export async function listInvoicesAction(
  filter: ListInvoicesFilter = {}
): Promise<InvoicingActionResult<{ invoices: InvoiceRecord[]; total: number }>> {
  try {
    await requireAuth();
    const res = await listInvoices(filter);
    return { success: true, data: res };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list invoices";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}


// ---------------------------------------------------------------------------
// Transition Invoice Action (TASK-046)
// ---------------------------------------------------------------------------

import {
  transitionInvoiceStatus,
} from "@/lib/services/invoicing.service";
import {
  InvoiceStateError,
  type InvoiceAction,
} from "@/lib/services/invoice-state.service";

export async function transitionInvoiceAction(params: {
  invoiceId: string;
  action: InvoiceAction;
  reason?: string;
}): Promise<InvoicingActionResult<{ invoiceId: string; newStatus: string }>> {
  try {
    const session = await requireRole(["staff", "admin"]);

    const updated = await transitionInvoiceStatus({
      invoiceId: params.invoiceId,
      action: params.action,
      actorId: session.user.id,
      actorRole: session.profile.role as "admin" | "staff",
      reason: params.reason,
    });

    return {
      success: true,
      data: {
        invoiceId: updated.id,
        newStatus: updated.status,
      },
    };
  } catch (err) {
    if (err instanceof InvoiceStateError) {
      return {
        success: false,
        error: err.message,
        errorCode: err.code,
      };
    }
    const message = err instanceof Error ? err.message : "Failed to update invoice status";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}
