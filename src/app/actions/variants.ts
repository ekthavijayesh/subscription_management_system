"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/audit";
import { variantCreateSchema, variantUpdateSchema } from "@/lib/validations/product";

export interface ActionState {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Admin creates a new product variant (TASK-030).
 */
export async function createVariantAction(formData: FormData): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);

    let parsedAttributes = {};
    const rawAttrs = formData.get("attributes");
    if (rawAttrs && typeof rawAttrs === "string") {
      try {
        parsedAttributes = JSON.parse(rawAttrs);
      } catch {
        return { success: false, error: "Attributes must be valid JSON" };
      }
    }

    const rawData = {
      productId: formData.get("productId"),
      name: formData.get("name"),
      sku: formData.get("sku"),
      attributes: parsedAttributes,
      isActive: formData.get("isActive") !== "false",
    };

    const parsed = variantCreateSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { productId, name, sku, attributes, isActive } = parsed.data;
    const supabase = createClient();

    // Check SKU uniqueness
    const { data: existingSku } = await supabase
      .from("product_variants")
      .select("id")
      .eq("sku", sku)
      .maybeSingle();

    if (existingSku) {
      return { success: false, error: `Variant with SKU "${sku}" already exists` };
    }

    const { data: variant, error: insertError } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        name,
        sku,
        attributes: attributes as any,
        is_active: isActive,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "product_variant",
      entityId: variant.id,
      action: "create",
      changes: { productId, name, sku, attributes, isActive },
    });

    revalidatePath(`/admin/products/${productId}`);
    return { success: true, data: { id: variant.id } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create variant" };
  }
}

/**
 * Admin archives a variant (TASK-030).
 */
export async function archiveVariantAction(
  variantId: string,
  productId: string
): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);
    const supabase = createClient();

    const { error } = await supabase
      .from("product_variants")
      .update({ is_active: false })
      .eq("id", variantId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "product_variant",
      entityId: variantId,
      action: "archive",
      changes: { is_active: false },
    });

    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to archive variant" };
  }
}

