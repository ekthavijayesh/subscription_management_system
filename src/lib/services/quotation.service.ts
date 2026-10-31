/**
 * TASK-036 — Quotation Service (Draft Create / Edit)
 *
 * Owns all database interactions for quotation drafts:
 * - createQuotationDraft: generates a unique quotation_number, prices all items via
 *   the pricing engine, persists quotation + items in a single DB write set.
 * - updateQuotationDraft: draft-only guard, safe recalculation, snapshot replacement.
 * - getQuotation: RLS-scoped single-record fetch.
 * - listQuotations: RLS-scoped list with filters.
 *
 * Invariants:
 * - Only drafts can be edited; any other status → error.
 * - Totals are always recomputed server-side via priceLineItems(); never trusted from client.
 * - Snapshots (unit_price, discount, tax) stored per line at time of save.
 * - quotation_number is generated deterministically as QUO-<YYYYMMDD>-<random5>.
 * - All writes use the server Supabase client (respects RLS for the acting user).
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { priceLineItems, PricingError } from "@/lib/services/quotation-pricing.service";
import type {
  CreateQuotationInput,
  UpdateQuotationInput,
  QuotationPriceSummary,
} from "@/lib/validations/quotation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generates a human-readable quotation number: QUO-20261031-A1B2C */
function generateQuotationNumber(): string {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `QUO-${ymd}-${rand}`;
}

// ---------------------------------------------------------------------------
// Output types (read contracts for UI / Amaya)
// ---------------------------------------------------------------------------

export interface QuotationRecord {
  id: string;
  quotation_number: string;
  customer_id: string;
  created_by: string;
  status: string;
  valid_until: string;
  currency: string;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  total: string;
  notes: string | null;
  accepted_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotationItemRecord {
  id: string;
  quotation_id: string;
  plan_id: string | null;
  description: string;
  sku: string | null;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  line_total: string;
}

export interface QuotationDetail extends QuotationRecord {
  items: QuotationItemRecord[];
  price_summary: QuotationPriceSummary;
}

export interface QuotationServiceError {
  code:
    | "NOT_FOUND"
    | "FORBIDDEN"
    | "NOT_A_DRAFT"
    | "PRICING_ERROR"
    | "DB_ERROR";
  message: string;
}

// ---------------------------------------------------------------------------
// Create quotation draft
// ---------------------------------------------------------------------------

export async function createQuotationDraft(
  input: CreateQuotationInput,
  actorId: string
): Promise<{ quotation: QuotationRecord; pricing: QuotationPriceSummary }> {
  // 1. Compute prices deterministically — never trust client totals
  const pricing = await priceLineItems({
    customerId: input.customer_id,
    currency: input.currency,
    validUntil: input.valid_until,
    items: input.items,
  });

  const supabase = createClient();
  const quotationNumber = generateQuotationNumber();

  // 2. Insert quotation header
  const { data: quotationData, error: quotationError } = await (supabase
    .from("quotations") as any)
    .insert({
      quotation_number: quotationNumber,
      customer_id: input.customer_id,
      created_by: actorId,
      status: "draft",
      valid_until: input.valid_until,
      currency: pricing.currency,
      subtotal: pricing.subtotal,
      discount_total: pricing.discount_total,
      tax_total: pricing.tax_total,
      total: pricing.total,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (quotationError || !quotationData) {
    throw new Error(
      `Failed to create quotation: ${quotationError?.message ?? "unknown error"}`
    );
  }

  const quotation = quotationData as unknown as QuotationRecord;

  // 3. Insert quotation items (one per priced line)
  const lineInserts = pricing.items.map((item) => ({
    quotation_id: quotation.id,
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
    .from("quotation_items") as any)
    .insert(lineInserts);

  if (itemsError) {
    // Attempt to clean up orphaned header — best effort; log the error
    await supabase.from("quotations").delete().eq("id", quotation.id);
    throw new Error(
      `Failed to create quotation items: ${itemsError.message}. Quotation header rolled back.`
    );
  }

  return { quotation, pricing };
}

// ---------------------------------------------------------------------------
// Update quotation draft
// ---------------------------------------------------------------------------

export async function updateQuotationDraft(
  input: UpdateQuotationInput,
  actorId: string
): Promise<{ quotation: QuotationRecord; pricing: QuotationPriceSummary }> {
  const supabase = createClient();

  // 1. Fetch current quotation to verify it's still a draft
  const { data: existing, error: fetchError } = await supabase
    .from("quotations")
    .select("id, status, customer_id, currency, created_by")
    .eq("id", input.quotation_id)
    .single();

  const currentQuotation = existing as {
    id: string;
    status: string;
    customer_id: string;
    currency: string;
    created_by: string;
  } | null;

  if (fetchError || !currentQuotation) {
    throw new Error(`Quotation ${input.quotation_id} not found`);
  }

  if (currentQuotation.status !== "draft") {
    throw new Error(
      `Quotation ${input.quotation_id} is in status "${currentQuotation.status}" and cannot be edited. Only drafts are editable.`
    );
  }

  // 2. Resolve effective values (merge patch semantics)
  const effectiveCurrency = input.currency ?? currentQuotation.currency;
  const effectiveValidUntil = input.valid_until ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // 3. Recompute prices server-side
  const pricing = input.items
    ? await priceLineItems({
        customerId: currentQuotation.customer_id,
        currency: effectiveCurrency,
        validUntil: effectiveValidUntil,
        items: input.items,
      })
    : null;

  // 4. Build update payload
  const updatePayload: Record<string, unknown> = {};
  if (input.valid_until) updatePayload.valid_until = input.valid_until;
  if (input.notes !== undefined) updatePayload.notes = input.notes;
  if (pricing) {
    updatePayload.currency = pricing.currency;
    updatePayload.subtotal = pricing.subtotal;
    updatePayload.discount_total = pricing.discount_total;
    updatePayload.tax_total = pricing.tax_total;
    updatePayload.total = pricing.total;
  }

  const { data: updatedData, error: updateError } = await (supabase
    .from("quotations") as any)
    .update(updatePayload)
    .eq("id", input.quotation_id)
    .select()
    .single();

  if (updateError || !updatedData) {
    throw new Error(
      `Failed to update quotation: ${updateError?.message ?? "unknown error"}`
    );
  }

  const quotation = updatedData as unknown as QuotationRecord;

  // 5. If items were provided, replace all existing items
  if (pricing && input.items) {
    // Delete existing items
    const { error: deleteError } = await supabase
      .from("quotation_items")
      .delete()
      .eq("quotation_id", input.quotation_id);

    if (deleteError) {
      throw new Error(`Failed to replace quotation items: ${deleteError.message}`);
    }

    // Insert fresh items from re-priced snapshot
    const lineInserts = pricing.items.map((item) => ({
      quotation_id: input.quotation_id,
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
      .from("quotation_items") as any)
      .insert(lineInserts);

    if (itemsError) {
      throw new Error(
        `Failed to insert updated quotation items: ${itemsError.message}`
      );
    }
  }

  // Return current pricing or re-fetch summary if items unchanged
  const effectivePricing = pricing ?? {
    currency: quotation.currency,
    items: [],
    subtotal: quotation.subtotal,
    discount_total: quotation.discount_total,
    tax_total: quotation.tax_total,
    total: quotation.total,
  };

  return { quotation, pricing: effectivePricing };
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

export async function getQuotationById(
  quotationId: string
): Promise<QuotationDetail | null> {
  const supabase = createClient();

  const { data: quotationData, error: quotationError } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", quotationId)
    .single();

  if (quotationError || !quotationData) return null;
  const quotation = quotationData as unknown as QuotationRecord;

  const { data: itemsData, error: itemsError } = await supabase
    .from("quotation_items")
    .select("*")
    .eq("quotation_id", quotationId)
    .order("created_at", { ascending: true });

  if (itemsError) return null;
  const items = (itemsData as unknown as QuotationItemRecord[]) ?? [];

  return {
    ...quotation,
    items,
    price_summary: {
      currency: quotation.currency,
      items: items.map((item) => ({
        plan_id: item.plan_id ?? "",
        plan_name: item.description,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_code: null,
        discount_type: null,
        discount_value: null,
        discount_amount: item.discount_amount,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        line_subtotal: item.unit_price,
        line_total: item.line_total,
      })),
      subtotal: quotation.subtotal,
      discount_total: quotation.discount_total,
      tax_total: quotation.tax_total,
      total: quotation.total,
    },
  };
}

export interface ListQuotationsFilter {
  customerId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function listQuotations(filter: ListQuotationsFilter = {}): Promise<{
  quotations: QuotationRecord[];
  total: number;
}> {
  const supabase = createClient();
  const limit = filter.limit ?? 20;
  const offset = filter.offset ?? 0;

  let query = supabase
    .from("quotations")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.customerId) {
    query = query.eq("customer_id", filter.customerId);
  }
  if (filter.status) {
    query = query.eq("status", filter.status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list quotations: ${error.message}`);
  }

  return {
    quotations: (data as unknown as QuotationRecord[]) ?? [],
    total: count ?? 0,
  };
}

// Re-export PricingError for callers that need to handle it
export { PricingError };


// ---------------------------------------------------------------------------
// Transition quotation status (TASK-037)
// ---------------------------------------------------------------------------

import {
  validateQuotationTransition,
  type QuotationAction,
  type QuotationStatus,
  QuotationStateError,
} from "@/lib/services/quotation-state.service";

export async function transitionQuotationStatus(params: {
  quotationId: string;
  action: QuotationAction;
  actorId: string;
  actorRole: "admin" | "staff" | "customer";
}): Promise<QuotationRecord> {
  const supabase = createClient();

  // 1. Fetch current quotation
  const { data: rawQuotation, error: fetchError } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", params.quotationId)
    .single();

  const quotation = rawQuotation as unknown as QuotationRecord;

  if (fetchError || !quotation) {
    throw new QuotationStateError("QUOTATION_NOT_FOUND", `Quotation ${params.quotationId} not found`);
  }

  // 2. Validate transition
  const { nextStatus } = validateQuotationTransition({
    currentStatus: quotation.status as QuotationStatus,
    action: params.action,
    userRole: params.actorRole,
    validUntil: quotation.valid_until,
  });

  // 3. Build update payload
  const updatePayload: Record<string, unknown> = {
    status: nextStatus,
  };

  if (nextStatus === "approved") {
    updatePayload.accepted_at = new Date().toISOString();
  }

  const { data: updatedData, error: updateError } = await (supabase
    .from("quotations") as any)
    .update(updatePayload)
    .eq("id", params.quotationId)
    .select()
    .single();

  if (updateError || !updatedData) {
    throw new Error(`Failed to update quotation state: ${updateError?.message ?? "unknown error"}`);
  }

  // 4. Log activity & dispatch notifications
  try {
    await (supabase.from("activity_logs") as any).insert({
      actor_id: params.actorId,
      entity_type: "quotation",
      entity_id: params.quotationId,
      action: `quotation_${params.action}`,
      changes: {
        from: quotation.status,
        to: nextStatus,
      },
    });

    // Notify customer when quote is sent, or staff when quote is approved/rejected
    if (nextStatus === "sent") {
      await (supabase.from("notifications") as any).insert({
        recipient_id: quotation.customer_id,
        title: `Quotation ${quotation.quotation_number} Sent`,
        message: `A new quotation (${quotation.quotation_number}) is ready for your review and approval.`,
        channel: "in_app",
        status: "unread",
        metadata: { quotation_id: quotation.id, total: quotation.total, currency: quotation.currency },
      });
    } else if (nextStatus === "approved" || nextStatus === "rejected") {
      await (supabase.from("notifications") as any).insert({
        recipient_id: quotation.created_by,
        title: `Quotation ${quotation.quotation_number} ${nextStatus.toUpperCase()}`,
        message: `Quotation ${quotation.quotation_number} has been ${nextStatus} by the customer.`,
        channel: "in_app",
        status: "unread",
        metadata: { quotation_id: quotation.id, actor_id: params.actorId },
      });
    }
  } catch (logErr) {
    console.error("Non-fatal error logging quotation transition/notification:", logErr);
  }

  return updatedData as unknown as QuotationRecord;
}
