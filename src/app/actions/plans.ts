"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/audit";
import { planCreateSchema, planUpdateSchema } from "@/lib/validations/plan";

export interface ActionState {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Admin creates a new subscription plan (TASK-033).
 */
export async function createPlanAction(formData: FormData): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);

    const rawData = {
      productId: formData.get("productId"),
      variantId: formData.get("variantId") || null,
      name: formData.get("name"),
      billingInterval: formData.get("billingInterval"),
      intervalCount: formData.get("intervalCount") || 1,
      price: formData.get("price"),
      currency: formData.get("currency") || "USD",
      isActive: formData.get("isActive") !== "false",
    };

    const parsed = planCreateSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const {
      productId,
      variantId,
      name,
      billingInterval,
      intervalCount,
      price,
      currency,
      isActive,
    } = parsed.data;

    const supabase = createClient();

    // Verify parent product exists and is active
    const { data: product } = await supabase
      .from("products")
      .select("id, is_active")
      .eq("id", productId)
      .single();

    if (!product || !product.is_active) {
      return { success: false, error: "Referenced product is invalid or archived" };
    }

    const { data: plan, error: insertError } = await supabase
      .from("plans")
      .insert({
        product_id: productId,
        variant_id: variantId || null,
        name,
        billing_interval: billingInterval,
        interval_count: intervalCount,
        price,
        currency,
        is_active: isActive,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "plan",
      entityId: plan.id,
      action: "create",
      changes: { productId, variantId, name, billingInterval, price, currency },
    });

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/staff/catalogue");
    revalidatePath("/customer/catalogue");
    return { success: true, data: { id: plan.id } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create plan" };
  }
}

/**
 * Admin archives a subscription plan (preserves historical subscriptions and quotes, TASK-033).
 */
export async function archivePlanAction(planId: string): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);
    const supabase = createClient();

    const { error } = await supabase
      .from("plans")
      .update({ is_active: false })
      .eq("id", planId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "plan",
      entityId: planId,
      action: "archive",
      changes: { is_active: false },
    });

    revalidatePath("/admin/plans");
    revalidatePath("/staff/catalogue");
    revalidatePath("/customer/catalogue");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to archive plan" };
  }
}

