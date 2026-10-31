"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/services/audit";
import type { Database } from "@/types/database.types";
import {
  customerCreateSchema,
  customerUpdateSchema,
  customerSelfUpdateSchema,
} from "@/lib/validations/customer";

export interface ActionState {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Admin or authorized Staff creates a new customer profile.
 */
export async function createCustomerAction(
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await requireAuth();
    if (session.profile.role !== "admin" && session.profile.role !== "staff") {
      return { success: false, error: "Unauthorized" };
    }

    const rawData = {
      email: formData.get("email"),
      fullName: formData.get("fullName"),
      phone: formData.get("phone") || null,
      companyName: formData.get("companyName") || null,
      billingAddress: {
        street: formData.get("street") || "",
        city: formData.get("city") || "",
        state: formData.get("state") || "",
        postalCode: formData.get("postalCode") || "",
        country: formData.get("country") || "",
      },
    };

    const parsed = customerCreateSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { email, fullName, phone, companyName, billingAddress } = parsed.data;

    // Use admin client to create user without exposing service role to client
    const adminSupabase = createAdminClient();
    const tempPassword = `Cust_${Math.random().toString(36).substring(2, 10)}!9`;

    const { data: newUser, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (createError) {
      return { success: false, error: createError.message };
    }

    // Update profile with details
    const supabase = createClient();
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        company_name: companyName,
        billing_address: billingAddress,
        role: "customer",
        is_active: true,
      })
      .eq("id", newUser.user.id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // If created by staff, automatically assign staff to the customer
    if (session.profile.role === "staff") {
      await supabase.from("customer_staff_assignments").insert({
        customer_id: newUser.user.id,
        staff_id: session.profile.id,
        assigned_by: session.profile.id,
        permissions: ["read", "write"],
        is_active: true,
      });
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "customer",
      entityId: newUser.user.id,
      action: "create",
      changes: { email, fullName, companyName },
    });

    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true, data: { id: newUser.user.id } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create customer" };
  }
}

/**
 * Admin or Staff updates customer details.
 */
export async function updateCustomerAction(
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await requireAuth();
    if (session.profile.role !== "admin" && session.profile.role !== "staff") {
      return { success: false, error: "Unauthorized" };
    }

    const rawData = {
      id: formData.get("id"),
      fullName: formData.get("fullName"),
      phone: formData.get("phone") || null,
      companyName: formData.get("companyName") || null,
      isActive: formData.get("isActive") === "true",
      billingAddress: {
        street: formData.get("street") || "",
        city: formData.get("city") || "",
        state: formData.get("state") || "",
        postalCode: formData.get("postalCode") || "",
        country: formData.get("country") || "",
      },
    };

    const parsed = customerUpdateSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { id, fullName, phone, companyName, billingAddress, isActive } =
      parsed.data;

    const supabase = createClient();

    // If staff, verify assignment
    if (session.profile.role === "staff") {
      const { data: assignment } = await supabase
        .from("customer_staff_assignments")
        .select("id")
        .eq("customer_id", id)
        .eq("staff_id", session.profile.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!assignment) {
        return { success: false, error: "Not assigned to this customer" };
      }
    }

    const updatePayload: Database["public"]["Tables"]["profiles"]["Update"] = {
      full_name: fullName,
      phone,
      company_name: companyName,
      billing_address: billingAddress,
    };

    // Only admin can change is_active status of customer
    if (session.profile.role === "admin" && isActive !== undefined) {
      updatePayload.is_active = isActive;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", id)
      .eq("role", "customer");

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "customer",
      entityId: id,
      action: "update",
      changes: updatePayload,
    });

    revalidatePath(`/admin/customers/${id}`);
    revalidatePath(`/staff/customers/${id}`);
    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update customer" };
  }
}

/**
 * Customer updates their own profile settings (TASK-026).
 * Restricted to permitted fields only: full_name, phone, company_name, billing_address.
 * Rejects role, email, or is_active modifications.
 */
export async function updateCustomerSelfAction(
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await requireAuth();
    if (session.profile.role !== "customer") {
      return { success: false, error: "Only customer role can update self profile" };
    }

    const rawData = {
      fullName: formData.get("fullName"),
      phone: formData.get("phone") || null,
      companyName: formData.get("companyName") || null,
      billingAddress: {
        street: formData.get("street") || "",
        city: formData.get("city") || "",
        state: formData.get("state") || "",
        postalCode: formData.get("postalCode") || "",
        country: formData.get("country") || "",
      },
    };

    const parsed = customerSelfUpdateSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { fullName, phone, companyName, billingAddress } = parsed.data;

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        company_name: companyName,
        billing_address: billingAddress,
      })
      .eq("id", session.profile.id)
      .eq("role", "customer");

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "profile",
      entityId: session.profile.id,
      action: "self_update",
      changes: { fullName, phone, companyName, billingAddress },
    });

    revalidatePath("/customer/settings");
    revalidatePath("/customer");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update profile" };
  }
}
