/**
 * TASK-035 — Quotation Pricing Engine
 *
 * Server-only, deterministic, transaction-safe pricing service.
 *
 * Rules:
 * - All monetary arithmetic uses integer-based fixed-point math (values scaled by 10000).
 *   We represent amounts as BigInt internally, format to "0.00" strings for output.
 *   BigInt constructor calls (BigInt(x)) are used rather than BigInt literals (xn) so the
 *   code compiles under both ES2020 and earlier TSC targets used by Next.js's type plugin.
 * - Never accept client-computed totals; always recompute server-side.
 * - Validate catalogue/plan active status before pricing.
 * - Validate customer exists in profiles table before pricing.
 * - Validate discount code eligibility: active, not expired, not exhausted, currency match.
 * - Tax: look up the first matching active tax_rule by priority; 0 if none found.
 *   Tax jurisdiction resolution is intentionally simple (one global rule lookup); a real
 *   multi-jurisdiction engine requires policy approval — see PROGRESS.md blocker note.
 * - Returns deterministic PricedLineItem[] + QuotationPriceSummary; caller persists to DB.
 * - All errors thrown as PricingError with a stable `code` so callers can handle them.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  QuotationLineItemInput,
  PricedLineItem,
  QuotationPriceSummary,
} from "@/lib/validations/quotation";

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type PricingErrorCode =
  | "CUSTOMER_NOT_FOUND"
  | "CUSTOMER_INACTIVE"
  | "PLAN_NOT_FOUND"
  | "PLAN_INACTIVE"
  | "CURRENCY_MISMATCH"
  | "DISCOUNT_NOT_FOUND"
  | "DISCOUNT_INACTIVE"
  | "DISCOUNT_EXPIRED"
  | "DISCOUNT_EXHAUSTED"
  | "DISCOUNT_CURRENCY_MISMATCH"
  | "VALID_UNTIL_IN_PAST"
  | "PRICING_INVARIANT_VIOLATION";

export class PricingError extends Error {
  constructor(
    public readonly code: PricingErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "PricingError";
  }
}

// ---------------------------------------------------------------------------
// Fixed-point arithmetic helpers (scale = 10000; no floats ever used)
// ---------------------------------------------------------------------------

const SCALE = BigInt(10000);
const HUNDRED = BigInt(100);
const ZERO = BigInt(0);
const ONE = BigInt(1);
const FIFTY = BigInt(50);

/**
 * Convert a "0.00" or "0.0000" DB/input string to scaled bigint cents.
 * Scale is 10000 so we can handle 4-decimal-place tax rates without float math.
 * e.g. "49.99" → 499900n, "0.0800" → 800n
 */
export function toCents(value: string | number): bigint {
  const str = typeof value === "number" ? value.toFixed(4) : String(value);
  const [whole = "0", frac = ""] = str.split(".");
  // Normalise fraction to exactly 4 digits
  const fracPadded = frac.padEnd(4, "0").slice(0, 4);
  return BigInt(whole) * SCALE + BigInt(fracPadded);
}

/**
 * Convert scaled bigint back to a "0.00" display string.
 * Rounds the 3rd–4th decimal places to 2 decimal places (half-up).
 */
export function fromCents(cents: bigint): string {
  const isNegative = cents < ZERO;
  const abs = isNegative ? -cents : cents;
  const whole = abs / SCALE;
  const remainder = abs % SCALE;
  // Round to 2 decimal places: take last 2 of 4 fractional digits, round half-up
  const twoDecimal = (remainder + FIFTY) / HUNDRED;
  const wholeAdj = twoDecimal === HUNDRED ? whole + ONE : whole;
  const fracAdj = twoDecimal === HUNDRED ? ZERO : twoDecimal;
  const sign = isNegative ? "-" : "";
  return `${sign}${wholeAdj}.${String(fracAdj).padStart(2, "0")}`;
}

/**
 * Multiply a scaled cent value by a rate (also stored in SCALE units).
 * e.g. cents=1000000n (=$100.00), rateStr="0.0800" → rateCents=800n
 *   result = (1000000 * 800) / 10000 = 80000n (=$8.00)
 */
function applyCentsRate(cents: bigint, rateStr: string): bigint {
  const rateCents = toCents(rateStr);
  return (cents * rateCents) / SCALE;
}

// ---------------------------------------------------------------------------
// Database-fetching helpers (all casts required — supabase-js type workaround)
// ---------------------------------------------------------------------------

async function fetchCustomer(customerId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, is_active, role")
    .eq("id", customerId)
    .single();
  // Cast: supabase-js v2 + postgrest-js type inference workaround (see authorization.ts)
  const profile = data as {
    id: string;
    is_active: boolean;
    role: string;
  } | null;
  if (error || !profile) {
    throw new PricingError("CUSTOMER_NOT_FOUND", `Customer ${customerId} not found`);
  }
  if (!profile.is_active) {
    throw new PricingError("CUSTOMER_INACTIVE", `Customer ${customerId} is inactive`);
  }
  return profile;
}

async function fetchPlan(planId: string, currency: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, price, currency, is_active, product_id")
    .eq("id", planId)
    .single();
  const plan = data as {
    id: string;
    name: string;
    price: number;
    currency: string;
    is_active: boolean;
    product_id: string;
  } | null;
  if (error || !plan) {
    throw new PricingError("PLAN_NOT_FOUND", `Plan ${planId} not found`);
  }
  if (!plan.is_active) {
    throw new PricingError("PLAN_INACTIVE", `Plan ${planId} is not active`, { planId });
  }
  if (plan.currency !== currency) {
    throw new PricingError(
      "CURRENCY_MISMATCH",
      `Plan ${planId} currency (${plan.currency}) does not match quotation currency (${currency})`,
      { planId, planCurrency: plan.currency, quotationCurrency: currency }
    );
  }
  return plan;
}

async function fetchPlanSku(planId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("product_variants")
    .select("sku")
    .eq("id", planId)
    .maybeSingle();
  const row = data as { sku: string | null } | null;
  return row?.sku ?? null;
}

async function fetchDiscount(code: string, currency: string) {
  const supabase = createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("discounts")
    .select(
      "id, code, type, value, currency, starts_at, ends_at, max_redemptions, times_redeemed, is_active"
    )
    .eq("code", code)
    .single();
  const discount = data as {
    id: string;
    code: string;
    type: "percentage" | "fixed_amount";
    value: number;
    currency: string | null;
    starts_at: string | null;
    ends_at: string | null;
    max_redemptions: number | null;
    times_redeemed: number;
    is_active: boolean;
  } | null;

  if (error || !discount) {
    throw new PricingError("DISCOUNT_NOT_FOUND", `Discount code "${code}" not found`);
  }
  if (!discount.is_active) {
    throw new PricingError("DISCOUNT_INACTIVE", `Discount code "${code}" is not active`);
  }
  if (discount.starts_at && discount.starts_at > now) {
    throw new PricingError("DISCOUNT_INACTIVE", `Discount code "${code}" is not yet active`);
  }
  if (discount.ends_at && discount.ends_at < now) {
    throw new PricingError(
      "DISCOUNT_EXPIRED",
      `Discount code "${code}" has expired`,
      { endsAt: discount.ends_at }
    );
  }
  if (
    discount.max_redemptions !== null &&
    discount.times_redeemed >= discount.max_redemptions
  ) {
    throw new PricingError(
      "DISCOUNT_EXHAUSTED",
      `Discount code "${code}" has reached its maximum redemptions`
    );
  }
  if (discount.currency !== null && discount.currency !== currency) {
    throw new PricingError(
      "DISCOUNT_CURRENCY_MISMATCH",
      `Discount code "${code}" is for currency ${discount.currency}, not ${currency}`
    );
  }
  return discount;
}

async function fetchActiveTaxRate(): Promise<string> {
  /**
   * Simplified: fetch the first active, non-expired global tax rule ordered by priority DESC.
   * Multi-jurisdiction requires explicit policy approval — see PROGRESS.md blocker.
   * Returns "0.0000" if no active rule found.
   */
  const supabase = createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("tax_rules")
    .select("rate")
    .eq("is_active", true)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = data as { rate: number } | null;
  return row?.rate !== undefined ? String(row.rate) : "0.0000";
}

// ---------------------------------------------------------------------------
// Core pricing function
// ---------------------------------------------------------------------------

export interface PriceLineItemsInput {
  customerId: string;
  currency: string;
  validUntil: string; // ISO 8601 UTC string
  items: QuotationLineItemInput[];
}

/**
 * Deterministically compute the full price breakdown for a set of line items.
 *
 * Steps per item:
 * 1. Validate plan is active and currency-matched.
 * 2. Validate discount code (if provided) — active, not expired, not exhausted.
 * 3. Compute discount_amount:
 *    - percentage: (line_subtotal * value) / (100 * SCALE) — integer division
 *    - fixed_amount: min(discount.value, line_subtotal)
 * 4. tax_amount = (line_subtotal - discount_amount) * tax_rate / SCALE
 * 5. line_total = line_subtotal - discount_amount + tax_amount
 *
 * All math uses BigInt — no floats ever.
 */
export async function priceLineItems(
  input: PriceLineItemsInput
): Promise<QuotationPriceSummary> {
  const { customerId, currency, validUntil, items } = input;

  // Guard: valid_until must be in the future
  if (new Date(validUntil) <= new Date()) {
    throw new PricingError(
      "VALID_UNTIL_IN_PAST",
      `valid_until (${validUntil}) must be a future datetime`
    );
  }

  // Validate customer exists and is active
  await fetchCustomer(customerId);

  // Fetch global tax rate once (shared across all items in this quotation)
  const taxRateStr = await fetchActiveTaxRate();

  const pricedItems: PricedLineItem[] = [];
  let totalSubtotalCents = ZERO;
  let totalDiscountCents = ZERO;
  let totalTaxCents = ZERO;

  for (const item of items) {
    const plan = await fetchPlan(item.plan_id, currency);

    const unitPriceCents = toCents(String(plan.price));
    const lineSubtotalCents = unitPriceCents * BigInt(item.quantity);

    // Discount computation
    let discountAmountCents = ZERO;
    let discountCode: string | null = null;
    let discountType: "percentage" | "fixed_amount" | null = null;
    let discountValue: string | null = null;

    if (item.discount_code) {
      const discount = await fetchDiscount(item.discount_code, currency);
      discountCode = discount.code;
      discountType = discount.type;
      discountValue = String(discount.value);

      if (discount.type === "percentage") {
        // percentage stored as e.g. 15.00 meaning 15%
        // discount_amount = line_subtotal * (value / 100)
        // In SCALE math: (lineSubtotalCents * rateCents) / (100 * SCALE)
        const rateCents = toCents(String(discount.value));
        discountAmountCents =
          (lineSubtotalCents * rateCents) / (HUNDRED * SCALE);
      } else {
        // fixed_amount: cap at line subtotal so discount never exceeds price
        const fixedCents = toCents(String(discount.value));
        discountAmountCents =
          fixedCents > lineSubtotalCents ? lineSubtotalCents : fixedCents;
      }
    }

    // Tax applied on post-discount base
    const taxBaseCents = lineSubtotalCents - discountAmountCents;
    const taxAmountCents = applyCentsRate(taxBaseCents, taxRateStr);

    const lineTotalCents = taxBaseCents + taxAmountCents;

    // Invariant: line_total must be >= 0
    if (lineTotalCents < ZERO) {
      throw new PricingError(
        "PRICING_INVARIANT_VIOLATION",
        `Computed line_total is negative for plan ${item.plan_id}`,
        { planId: item.plan_id, lineTotalCents: String(lineTotalCents) }
      );
    }

    totalSubtotalCents = totalSubtotalCents + lineSubtotalCents;
    totalDiscountCents = totalDiscountCents + discountAmountCents;
    totalTaxCents = totalTaxCents + taxAmountCents;

    const sku = await fetchPlanSku(item.plan_id);

    pricedItems.push({
      plan_id: item.plan_id,
      plan_name: plan.name,
      description: item.description ?? plan.name,
      sku,
      quantity: item.quantity,
      unit_price: fromCents(unitPriceCents),
      discount_code: discountCode,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: fromCents(discountAmountCents),
      tax_rate: taxRateStr,
      tax_amount: fromCents(taxAmountCents),
      line_subtotal: fromCents(lineSubtotalCents),
      line_total: fromCents(lineTotalCents),
    });
  }

  const grandTotal = totalSubtotalCents - totalDiscountCents + totalTaxCents;

  // Invariant: grand total must be >= 0
  if (grandTotal < ZERO) {
    throw new PricingError(
      "PRICING_INVARIANT_VIOLATION",
      "Computed grand total is negative — discount exceeds subtotal",
      { grandTotalCents: String(grandTotal) }
    );
  }

  return {
    currency,
    items: pricedItems,
    subtotal: fromCents(totalSubtotalCents),
    discount_total: fromCents(totalDiscountCents),
    tax_total: fromCents(totalTaxCents),
    total: fromCents(grandTotal),
  };
}
