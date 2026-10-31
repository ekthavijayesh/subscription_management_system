"use server";

/**
 * TASK-050 & TASK-051 — Discounts & Tax Rules Server Actions
 */

import { requireRole } from "@/lib/auth/authorization";
import {
  CreateDiscountSchema,
  CreateTaxRuleSchema,
} from "@/lib/validations/discounts-taxes";
import {
  createDiscount,
  listDiscounts,
  toggleDiscountStatus,
  createTaxRule,
  listTaxRules,
  toggleTaxRuleStatus,
  type DiscountRecord,
  type TaxRuleRecord,
} from "@/lib/services/discounts-taxes.service";

export interface ConfigActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// Discounts Actions
// ---------------------------------------------------------------------------

export async function createDiscountAction(
  rawInput: unknown
): Promise<ConfigActionResult<DiscountRecord>> {
  try {
    await requireRole(["admin"]);

    const parsed = CreateDiscountSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const discount = await createDiscount(parsed.data);
    return { success: true, data: discount };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create discount";
    return { success: false, error: message };
  }
}

export async function listDiscountsAction(): Promise<
  ConfigActionResult<DiscountRecord[]>
> {
  try {
    await requireRole(["admin", "staff"]);
    const list = await listDiscounts();
    return { success: true, data: list };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load discounts";
    return { success: false, error: message };
  }
}

export async function toggleDiscountAction(params: {
  discountId: string;
  isActive: boolean;
}): Promise<ConfigActionResult<DiscountRecord>> {
  try {
    await requireRole(["admin"]);
    const res = await toggleDiscountStatus(params.discountId, params.isActive);
    return { success: true, data: res };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update discount";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Tax Rules Actions
// ---------------------------------------------------------------------------

export async function createTaxRuleAction(
  rawInput: unknown
): Promise<ConfigActionResult<TaxRuleRecord>> {
  try {
    await requireRole(["admin"]);

    const parsed = CreateTaxRuleSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const rule = await createTaxRule(parsed.data);
    return { success: true, data: rule };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create tax rule";
    return { success: false, error: message };
  }
}

export async function listTaxRulesAction(): Promise<
  ConfigActionResult<TaxRuleRecord[]>
> {
  try {
    await requireRole(["admin", "staff"]);
    const list = await listTaxRules();
    return { success: true, data: list };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load tax rules";
    return { success: false, error: message };
  }
}

export async function toggleTaxRuleAction(params: {
  taxRuleId: string;
  isActive: boolean;
}): Promise<ConfigActionResult<TaxRuleRecord>> {
  try {
    await requireRole(["admin"]);
    const res = await toggleTaxRuleStatus(params.taxRuleId, params.isActive);
    return { success: true, data: res };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update tax rule";
    return { success: false, error: message };
  }
}
