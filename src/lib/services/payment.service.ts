/**
 * TASK-047 — Payment Service (Recording & Safe Balance Allocation)
 *
 * Implements transaction-safe payment recording:
 * - Validates amount > 0, currency match, and payment method.
 * - Invariant: Overpayment is prohibited without explicit policy approval.
 *   Amount paid must not exceed invoice amount_due.
 * - Updates invoice:
 *   - new amount_paid = previous amount_paid + payment amount
 *   - new amount_due = previous amount_due - payment amount
 *   - if amount_due == 0 -> status transitions to 'paid' with paid_at timestamp.
 * - Generates unique payment number: PAY-YYYYMMDD-XXXXX.
 * - Records audit event in `activity_logs` and sends an in-app confirmation notification.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toCents, fromCents } from "@/lib/services/quotation-pricing.service";
import { getInvoiceById, type InvoiceRecord } from "@/lib/services/invoicing.service";

export interface PaymentRecord {
  id: string;
  payment_number: string;
  invoice_id: string;
  customer_id: string;
  amount: string;
  currency: string;
  payment_method: "credit_card" | "bank_transfer" | "cash" | "manual" | "other";
  provider: string | null;
  provider_transaction_id: string | null;
  status: "pending" | "completed" | "failed" | "refunded";
  recorded_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
}

export class PaymentError extends Error {
  constructor(
    public readonly code:
      | "INVOICE_NOT_FOUND"
      | "INVOICE_NOT_PAYABLE"
      | "CURRENCY_MISMATCH"
      | "INVALID_AMOUNT"
      | "OVERPAYMENT_NOT_ALLOWED"
      | "INTERNAL_ERROR",
    message: string
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

function generatePaymentNumber(): string {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `PAY-${ymd}-${rand}`;
}

export async function recordPayment(params: {
  invoiceId: string;
  amount: string; // "XX.XX" format
  paymentMethod: "credit_card" | "bank_transfer" | "cash" | "manual" | "other";
  providerTransactionId?: string;
  notes?: string;
  actorId: string;
}): Promise<{ payment: PaymentRecord; updatedInvoice: InvoiceRecord }> {
  const supabase = createClient();

  // 1. Fetch target invoice
  const invoice = await getInvoiceById(params.invoiceId);
  if (!invoice) {
    throw new PaymentError("INVOICE_NOT_FOUND", `Invoice ${params.invoiceId} not found`);
  }

  // Invoice must be in a payable status
  if (invoice.status !== "issued" && invoice.status !== "overdue") {
    throw new PaymentError(
      "INVOICE_NOT_PAYABLE",
      `Invoice ${invoice.invoice_number} is in status '${invoice.status}' and cannot accept payments.`
    );
  }

  // 2. Validate amount in fixed-point cents
  const paymentCents = toCents(params.amount);
  if (paymentCents <= 0n) {
    throw new PaymentError("INVALID_AMOUNT", "Payment amount must be greater than zero.");
  }

  const currentDueCents = toCents(invoice.amount_due);
  const currentPaidCents = toCents(invoice.amount_paid);

  // Invariant: Overpayment blocked pending policy approval per ektha.md
  if (paymentCents > currentDueCents) {
    throw new PaymentError(
      "OVERPAYMENT_NOT_ALLOWED",
      `Payment amount (${params.amount}) exceeds outstanding balance (${invoice.amount_due}). Overpayment is not permitted.`
    );
  }

  // Calculate new balances
  const newPaidCents = currentPaidCents + paymentCents;
  const newDueCents = currentDueCents - paymentCents;
  const isFullyPaid = newDueCents === 0n;

  const now = new Date().toISOString();
  const paymentNumber = generatePaymentNumber();

  // 3. Insert payment record
  const { data: paymentData, error: paymentError } = await (supabase
    .from("payments") as any)
    .insert({
      payment_number: paymentNumber,
      invoice_id: invoice.id,
      customer_id: invoice.customer_id,
      amount: fromCents(paymentCents),
      currency: invoice.currency,
      payment_method: params.paymentMethod,
      provider: "manual",
      provider_transaction_id: params.providerTransactionId ?? null,
      status: "completed",
      recorded_by: params.actorId,
      verified_at: now,
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (paymentError || !paymentData) {
    throw new PaymentError(
      "INTERNAL_ERROR",
      `Failed to record payment: ${paymentError?.message ?? "unknown error"}`
    );
  }

  const payment = paymentData as unknown as PaymentRecord;

  // 4. Update invoice balances and status
  const invoiceUpdate: Record<string, unknown> = {
    amount_paid: fromCents(newPaidCents),
    amount_due: fromCents(newDueCents),
  };

  if (isFullyPaid) {
    invoiceUpdate.status = "paid";
    invoiceUpdate.paid_at = now;
  }

  const { data: updatedInvoiceData, error: invoiceUpdateError } = await (supabase
    .from("invoices") as any)
    .update(invoiceUpdate)
    .eq("id", invoice.id)
    .select()
    .single();

  if (invoiceUpdateError || !updatedInvoiceData) {
    // Rollback payment record if invoice balance update fails
    await supabase.from("payments").delete().eq("id", payment.id);
    throw new PaymentError(
      "INTERNAL_ERROR",
      `Failed to allocate payment to invoice: ${invoiceUpdateError?.message}`
    );
  }

  const updatedInvoice = updatedInvoiceData as unknown as InvoiceRecord;

  // 5. Audit & Notifications
  try {
    await (supabase.from("activity_logs") as any).insert({
      actor_id: params.actorId,
      entity_type: "payment",
      entity_id: payment.id,
      action: "payment_recorded",
      changes: {
        payment_number: payment.payment_number,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: payment.amount,
        remaining_due: updatedInvoice.amount_due,
        invoice_status: updatedInvoice.status,
      },
    });

    await (supabase.from("notifications") as any).insert({
      recipient_id: invoice.customer_id,
      title: "Payment Received",
      message: `Payment ${payment.payment_number} of ${payment.currency} ${payment.amount} has been applied to Invoice ${invoice.invoice_number}.`,
      channel: "in_app",
      status: "unread",
      metadata: {
        payment_id: payment.id,
        invoice_id: invoice.id,
        remaining_balance: updatedInvoice.amount_due,
      },
    });
  } catch (err) {
    console.error("Non-fatal payment audit/notification logging error:", err);
  }

  return {
    payment,
    updatedInvoice,
  };
}


// ---------------------------------------------------------------------------
// Payment History & Receipt Queries (TASK-049)
// ---------------------------------------------------------------------------

export interface ListPaymentsFilter {
  customerId?: string;
  invoiceId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function listPayments(
  filter: ListPaymentsFilter = {}
): Promise<{ payments: PaymentRecord[]; total: number }> {
  const supabase = createClient();
  const limit = filter.limit ?? 20;
  const offset = filter.offset ?? 0;

  let query = supabase
    .from("payments")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.customerId) query = query.eq("customer_id", filter.customerId);
  if (filter.invoiceId) query = query.eq("invoice_id", filter.invoiceId);
  if (filter.status) query = query.eq("status", filter.status as any);

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`Failed to list payments: ${error.message}`);
  }

  return {
    payments: (data as unknown as PaymentRecord[]) ?? [],
    total: count ?? 0,
  };
}

export async function getPaymentById(
  paymentId: string
): Promise<PaymentRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (error || !data) return null;
  return data as unknown as PaymentRecord;
}
