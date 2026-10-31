"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/audit";
import { productCreateSchema, productUpdateSchema } from "@/lib/validations/product";

export interface ActionState {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Admin creates a new product (TASK-029).
 */
export async function createProductAction(formData: FormData): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);

    const rawData = {
      name: formData.get("name"),
      description: formData.get("description") || null,
      sku: formData.get("sku"),
      isActive: formData.get("isActive") !== "false",
    };

    const parsed = productCreateSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { name, description, sku, isActive } = parsed.data;
    const supabase = createClient();

    // Check SKU uniqueness
    const { data: existingSku } = await supabase
      .from("products")
      .select("id")
      .eq("sku", sku)
      .maybeSingle();

    if (existingSku) {
      return { success: false, error: `Product with SKU "${sku}" already exists` };
    }

    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert({
        name,
        description,
        sku,
        is_active: isActive,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "product",
      entityId: product.id,
      action: "create",
      changes: { name, sku, description, isActive },
    });

    revalidatePath("/admin/products");
    revalidatePath("/staff/catalogue");
    revalidatePath("/customer/catalogue");
    return { success: true, data: { id: product.id } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create product" };
  }
}

/**
 * Admin updates an existing product.
 */
export async function updateProductAction(formData: FormData): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);

    const rawData = {
      id: formData.get("id"),
      name: formData.get("name"),
      description: formData.get("description") || null,
      sku: formData.get("sku"),
      isActive: formData.get("isActive") === "true",
    };

    const parsed = productUpdateSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { id, name, description, sku, isActive } = parsed.data;
    const supabase = createClient();

    // Verify SKU uniqueness excluding self
    const { data: duplicateSku } = await supabase
      .from("products")
      .select("id")
      .eq("sku", sku)
      .neq("id", id)
      .maybeSingle();

    if (duplicateSku) {
      return { success: false, error: `SKU "${sku}" is already in use by another product` };
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({
        name,
        description,
        sku,
        is_active: isActive,
      })
      .eq("id", id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "product",
      entityId: id,
      action: "update",
      changes: { name, sku, description, isActive },
    });

    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/admin/products");
    revalidatePath("/staff/catalogue");
    revalidatePath("/customer/catalogue");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update product" };
  }
}

/**
 * Admin archives a product (archive-safe, preserves historical quotes and invoices, TASK-029/TASK-032).
 */
export async function archiveProductAction(id: string): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);
    const supabase = createClient();

    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "product",
      entityId: id,
      action: "archive",
      changes: { is_active: false },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/staff/catalogue");
    revalidatePath("/customer/catalogue");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to archive product" };
  }
}

