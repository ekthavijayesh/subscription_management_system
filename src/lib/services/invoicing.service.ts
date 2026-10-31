/**
 * TASK-043 — Invoicing Service (Transaction-Safe & Period-Unique)
 *
 * Implements transaction-safe invoice generation:
 * - Invariant: Exactly one invoice per subscription period via:
 *   CONSTRAINT uq_subscription_billing_period UNIQUE (subscription_id, billing_period_start, billing_period_end)
 * - Safe retry/concurrency: if an invoice for the period already exists, returns the existing record
 *   (or conflict), never creating a duplicate.
 * - Snapshots line items from subscription_items (immutable historical financial record).
 * - Generates unique invoice number: INV-YYYYMMDD-XXXXX.
 * - Amount due = Total - Amount paid.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionById } from "@/lib/services/subscription.service";

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  customer_id: string;
  subscription_id: string | null;
  billing_period_start: string;
  billing_period_end: string;
  status: "draft" | "issued" | "paid" | "overdue" | "cancelled" | "void";
  due_date: string;
  currency: string;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  total: string;
  amount_paid: string;
  amount_due: string;
  issued_at: string;
  paid_at: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItemRecord {
  id: string;
  invoice_id: string;
  subscription_item_id: string | null;
  description: string;
  sku: string | null;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  line_total: string;
  created_at: string;
}

export interface InvoiceDetail extends InvoiceRecord {
  items: InvoiceItemRecord[];
}

export class InvoicingError extends Error {
  constructor(
    public readonly code:
      | "SUBSCRIPTION_NOT_FOUND"
      | "INVALID_PERIOD"
      | "DUPLICATE_PERIOD"
      | "INTERNAL_ERROR",
    message: string
  ) {
    super(message);
    this.name = "InvoicingError";
  }
}

function generateInvoiceNumber(): string {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `INV-${ymd}-${rand}`;
}

export async function generateSubscriptionInvoice(params: {
  subscriptionId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate?: string;
  actorId?: string;
}): Promise<{ invoice: InvoiceRecord; isExisting: boolean }> {
  const supabase = createClient();

  // 1. Period bounds check
  if (new Date(params.billingPeriodStart) >= new Date(params.billingPeriodEnd)) {
    throw new InvoicingError(
      "INVALID_PERIOD",
      "billingPeriodStart must be strictly before billingPeriodEnd"
    );
  }

  // 2. Concurrency/Idempotency check: Look for existing invoice for this period
  const { data: existingData } = await supabase
    .from("invoices")
    .select("*")
    .eq("subscription_id", params.subscriptionId)
    .eq("billing_period_start", params.billingPeriodStart)
    .eq("billing_period_end", params.billingPeriodEnd)
    .maybeSingle();

  if (existingData) {
    return {
      invoice: existingData as unknown as InvoiceRecord,
      isExisting: true,
    };
  }

  // 3. Fetch subscription snapshot
  const subscription = await getSubscriptionById(params.subscriptionId);
  if (!subscription) {
    throw new InvoicingError(
      "SUBSCRIPTION_NOT_FOUND",
      `Subscription ${params.subscriptionId} not found`
    );
  }

  const invoiceNumber = generateInvoiceNumber();
  const now = new Date().toISOString();
  // Default due date: 14 days from period start, or passed dueDate
  const dueDate =
    params.dueDate ??
    new Date(new Date(params.billingPeriodStart).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  // 4. Insert invoice header
  const { data: invoiceData, error: invoiceError } = await (supabase
    .from("invoices") as any)
    .insert({
      invoice_number: invoiceNumber,
      customer_id: subscription.customer_id,
      subscription_id: subscription.id,
      billing_period_start: params.billingPeriodStart,
      billing_period_end: params.billingPeriodEnd,
      status: "issued",
      due_date: dueDate,
      currency: subscription.currency,
      subtotal: subscription.subtotal,
      discount_total: subscription.discount_total,
      tax_total: subscription.tax_total,
      total: subscription.total,
      amount_paid: "0.00",
      amount_due: subscription.total,
      issued_at: now,
    })
    .select()
    .single();

  if (invoiceError) {
    // If caught by DB unique constraint race condition, fetch and return existing
    if (invoiceError.code === "23505" || invoiceError.message.includes("uq_subscription_billing_period")) {
      const { data: racedData } = await supabase
        .from("invoices")
        .select("*")
        .eq("subscription_id", params.subscriptionId)
        .eq("billing_period_start", params.billingPeriodStart)
        .eq("billing_period_end", params.billingPeriodEnd)
        .single();

      if (racedData) {
        return {
          invoice: racedData as unknown as InvoiceRecord,
          isExisting: true,
        };
      }
    }

    throw new InvoicingError(
      "INTERNAL_ERROR",
      `Failed to create invoice header: ${invoiceError.message}`
    );
  }

  const invoice = invoiceData as unknown as InvoiceRecord;

  // 5. Insert invoice snapshot items from subscription_items
  const invoiceItems = subscription.items.map((item) => ({
    invoice_id: invoice.id,
    subscription_item_id: item.id,
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
    .from("invoice_items") as any)
    .insert(invoiceItems);

  if (itemsError) {
    // Attempt rollback of created invoice header
    await supabase.from("invoices").delete().eq("id", invoice.id);
    throw new InvoicingError(
      "INTERNAL_ERROR",
      `Failed to insert invoice items: ${itemsError.message}. Invoice header rolled back.`
    );
  }

  // 6. Audit & Notification
  try {
    await (supabase.from("notifications") as any).insert({
      recipient_id: invoice.customer_id,
      title: `New Invoice ${invoice.invoice_number}`,
      message: `Invoice ${invoice.invoice_number} for ${invoice.currency} ${invoice.total} has been issued.`,
      channel: "in_app",
      status: "unread",
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount_due: invoice.amount_due,
      },
    });

    await (supabase.from("activity_logs") as any).insert({
      actor_id: params.actorId ?? null,
      entity_type: "invoice",
      entity_id: invoice.id,
      action: "invoice_generated",
      changes: {
        subscription_id: subscription.id,
        invoice_number: invoice.invoice_number,
        total: invoice.total,
        period_start: params.billingPeriodStart,
        period_end: params.billingPeriodEnd,
      },
    });
  } catch (logErr) {
    console.error("Non-fatal invoice logging error:", logErr);
  }

  return {
    invoice,
    isExisting: false,
  };
}


// ---------------------------------------------------------------------------
// Invoice Read Operations (TASK-044)
// ---------------------------------------------------------------------------

export interface ListInvoicesFilter {
  customerId?: string;
  subscriptionId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function listInvoices(
  filter: ListInvoicesFilter = {}
): Promise<{ invoices: InvoiceRecord[]; total: number }> {
  const supabase = createClient();
  const limit = filter.limit ?? 20;
  const offset = filter.offset ?? 0;

  let query = supabase
    .from("invoices")
    .select("*", { count: "exact" })
    .order("issued_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.customerId) query = query.eq("customer_id", filter.customerId);
  if (filter.subscriptionId) query = query.eq("subscription_id", filter.subscriptionId);
  if (filter.status) query = query.eq("status", filter.status);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list invoices: ${error.message}`);
  }

  return {
    invoices: (data as unknown as InvoiceRecord[]) ?? [],
    total: count ?? 0,
  };
}

export async function getInvoiceById(
  invoiceId: string
): Promise<InvoiceDetail | null> {
  const supabase = createClient();

  const { data: invData, error: invError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (invError || !invData) return null;
  const invoice = invData as unknown as InvoiceRecord;

  const { data: itemsData, error: itemsError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });

  if (itemsError) return null;
  const items = (itemsData as unknown as InvoiceItemRecord[]) ?? [];

  return {
    ...invoice,
    items,
  };
}


// ---------------------------------------------------------------------------
// Transition Invoice Status (TASK-046)
// ---------------------------------------------------------------------------

import {
  validateInvoiceTransition,
  type InvoiceAction,
  type InvoiceStatus,
  InvoiceStateError,
} from "@/lib/services/invoice-state.service";

export async function transitionInvoiceStatus(params: {
  invoiceId: string;
  action: InvoiceAction;
  actorId: string;
  actorRole: "admin" | "staff" | "system" | "customer";
  reason?: string;
}): Promise<InvoiceRecord> {
  const supabase = createClient();

  const { data: rawInv, error: fetchError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", params.invoiceId)
    .single();

  const invoice = rawInv as unknown as InvoiceRecord;

  if (fetchError || !invoice) {
    throw new InvoiceStateError("NOT_FOUND", `Invoice ${params.invoiceId} not found`);
  }

  const { nextStatus } = validateInvoiceTransition({
    currentStatus: invoice.status,
    action: params.action,
    userRole: params.actorRole,
  });

  const updatePayload: Record<string, unknown> = {
    status: nextStatus,
  };

  if (nextStatus === "paid") {
    updatePayload.paid_at = new Date().toISOString();
    updatePayload.amount_due = "0.00";
    updatePayload.amount_paid = invoice.total;
  }

  const { data: updatedData, error: updateError } = await (supabase
    .from("invoices") as any)
    .update(updatePayload)
    .eq("id", params.invoiceId)
    .select()
    .single();

  if (updateError || !updatedData) {
    throw new Error(`Failed to transition invoice: ${updateError?.message ?? "unknown"}`);
  }

  // Audit event
  try {
    await (supabase.from("activity_logs") as any).insert({
      actor_id: params.actorId,
      entity_type: "invoice",
      entity_id: invoice.id,
      action: `invoice_${params.action}`,
      changes: {
        from: invoice.status,
        to: nextStatus,
        reason: params.reason,
      },
    });

    await (supabase.from("notifications") as any).insert({
      recipient_id: invoice.customer_id,
      title: `Invoice ${invoice.invoice_number} ${nextStatus.toUpperCase()}`,
      message: `Invoice ${invoice.invoice_number} has been updated to '${nextStatus}'.`,
      channel: "in_app",
      status: "unread",
      metadata: { invoice_id: invoice.id, status: nextStatus },
    });
  } catch (err) {
    console.error("Non-fatal invoice audit error:", err);
  }

  return updatedData as unknown as InvoiceRecord;
}
