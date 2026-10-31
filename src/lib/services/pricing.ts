import { createClient } from "@/lib/supabase/server";
import type { BillingInterval } from "@/types/database.types";

export interface ServerPlanPricing {
  planId: string;
  productId: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  planName: string;
  sku: string;
  billingInterval: BillingInterval;
  intervalCount: number;
  unitPrice: number;
  currency: string;
  isActive: boolean;
}

export interface CalculatedPlanQuote {
  planId: string;
  productId: string;
  variantId: string | null;
  description: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  billingInterval: BillingInterval;
  intervalCount: number;
  subtotal: number;
  lineTotal: number;
}

/**
 * Reads server-authoritative plan terms from the database.
 * Client-provided prices are strictly rejected.
 */
export async function getPlanPricingTerms(
  planId: string
): Promise<ServerPlanPricing> {
  const supabase = createClient();

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(`
      id,
      name,
      billing_interval,
      interval_count,
      price,
      currency,
      is_active,
      product_id,
      variant_id
    `)
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    throw new Error(`Plan not found for ID: ${planId}`);
  }

  if (!plan.is_active) {
    throw new Error(`Plan "${plan.name}" is archived and cannot be quoted`);
  }

  // Fetch product information
  const { data: product, error: prodError } = await supabase
    .from("products")
    .select("name, sku, is_active")
    .eq("id", plan.product_id)
    .single();

  if (prodError || !product || !product.is_active) {
    throw new Error(`Associated product is archived or inactive`);
  }

  // Fetch variant information if applicable
  let variantName: string | null = null;
  let sku = product.sku || "";

  if (plan.variant_id) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("name, sku, is_active")
      .eq("id", plan.variant_id)
      .single();

    if (variant) {
      if (!variant.is_active) {
        throw new Error(`Associated variant "${variant.name}" is archived`);
      }
      variantName = variant.name;
      if (variant.sku) sku = variant.sku;
    }
  }

  return {
    planId: plan.id,
    productId: plan.product_id,
    productName: product.name,
    variantId: plan.variant_id,
    variantName,
    planName: plan.name,
    sku,
    billingInterval: plan.billing_interval as BillingInterval,
    intervalCount: plan.interval_count,
    unitPrice: Number(plan.price),
    currency: plan.currency,
    isActive: plan.is_active,
  };
}

/**
 * Calculates deterministic server pricing snapshot for quotation line item creation.
 * Ektha's quote pricing engine (TASK-035) consumes this read model.
 */
export async function calculateServerLineItem(
  planId: string,
  quantity: number
): Promise<CalculatedPlanQuote> {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer");
  }

  const terms = await getPlanPricingTerms(planId);

  // Exact money calculation in cents to avoid JS floating-point issues
  const unitPriceCents = Math.round(terms.unitPrice * 100);
  const totalCents = unitPriceCents * quantity;
  const lineTotal = totalCents / 100;

  const description = terms.variantName
    ? `${terms.productName} (${terms.variantName}) — ${terms.planName}`
    : `${terms.productName} — ${terms.planName}`;

  return {
    planId: terms.planId,
    productId: terms.productId,
    variantId: terms.variantId,
    description,
    sku: terms.sku,
    quantity,
    unitPrice: terms.unitPrice,
    currency: terms.currency,
    billingInterval: terms.billingInterval,
    intervalCount: terms.intervalCount,
    subtotal: lineTotal,
    lineTotal,
  };
}

