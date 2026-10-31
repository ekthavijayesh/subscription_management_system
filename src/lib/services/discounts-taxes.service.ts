/**
 * TASK-050 & TASK-051 — Discounts & Tax Rules Administration Service
 *
 * Implements CRUD, activation, and eligibility management for discounts and tax rules:
 * - Admin configuration for discount codes (percentage vs fixed amount, redemption caps, effective dates).
 * - Admin configuration for tax rules (jurisdiction, priority, rate numeric(6,4), inclusive flag).
 * - Directly integrated with `quotation-pricing.service.ts` to compute verified snapshots.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateDiscountInput,
  CreateTaxRuleInput,
} from "@/lib/validations/discounts-taxes";

export interface DiscountRecord {
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
  created_at: string;
  updated_at: string;
}

export interface TaxRuleRecord {
  id: string;
  name: string;
  jurisdiction: string;
  rate: number;
  is_inclusive: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Discounts Management (TASK-050)
// ---------------------------------------------------------------------------

export async function createDiscount(input: CreateDiscountInput): Promise<DiscountRecord> {
  const supabase = createClient();

  const { data, error } = await (supabase.from("discounts") as any)
    .insert({
      code: input.code,
      type: input.type,
      value: input.value,
      currency: input.currency,
      starts_at: input.starts_at ?? null,
      ends_at: input.ends_at ?? null,
      max_redemptions: input.max_redemptions ?? null,
      is_active: input.is_active,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create discount: ${error?.message ?? "unknown"}`);
  }

  return data as unknown as DiscountRecord;
}

export async function listDiscounts(): Promise<DiscountRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list discounts: ${error.message}`);
  }

  return (data as unknown as DiscountRecord[]) ?? [];
}

export async function toggleDiscountStatus(
  discountId: string,
  isActive: boolean
): Promise<DiscountRecord> {
  const supabase = createClient();
  const { data, error } = await (supabase.from("discounts") as any)
    .update({ is_active: isActive })
    .eq("id", discountId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update discount status: ${error?.message}`);
  }

  return data as unknown as DiscountRecord;
}

// ---------------------------------------------------------------------------
// Tax Rules Management (TASK-051)
// ---------------------------------------------------------------------------

export async function createTaxRule(input: CreateTaxRuleInput): Promise<TaxRuleRecord> {
  const supabase = createClient();

  const { data, error } = await (supabase.from("tax_rules") as any)
    .insert({
      name: input.name,
      jurisdiction: input.jurisdiction,
      rate: input.rate,
      is_inclusive: input.is_inclusive,
      priority: input.priority,
      starts_at: input.starts_at ?? null,
      ends_at: input.ends_at ?? null,
      is_active: input.is_active,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create tax rule: ${error?.message ?? "unknown"}`);
  }

  return data as unknown as TaxRuleRecord;
}

export async function listTaxRules(): Promise<TaxRuleRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tax_rules")
    .select("*")
    .order("priority", { ascending: false });

  if (error) {
    throw new Error(`Failed to list tax rules: ${error.message}`);
  }

  return (data as unknown as TaxRuleRecord[]) ?? [];
}

export async function toggleTaxRuleStatus(
  taxRuleId: string,
  isActive: boolean
): Promise<TaxRuleRecord> {
  const supabase = createClient();
  const { data, error } = await (supabase.from("tax_rules") as any)
    .update({ is_active: isActive })
    .eq("id", taxRuleId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update tax rule status: ${error?.message}`);
  }

  return data as unknown as TaxRuleRecord;
}
