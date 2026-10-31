"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/audit";
import { assignmentCreateSchema, assignmentToggleSchema } from "@/lib/validations/assignment";

export interface ActionState {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Admin assigns a staff member to a customer (TASK-028).
 */
export async function assignStaffAction(formData: FormData): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);

    const rawData = {
      customerId: formData.get("customerId"),
      staffId: formData.get("staffId"),
      permissions: formData.getAll("permissions") as string[],
    };

    const parsed = assignmentCreateSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { customerId, staffId, permissions } = parsed.data;
    const supabase = createClient();

    // Check if an assignment already exists
    const { data: existing } = await supabase
      .from("customer_staff_assignments")
      .select("id, is_active")
      .eq("customer_id", customerId)
      .eq("staff_id", staffId)
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        return { success: false, error: "Staff member is already actively assigned to this customer" };
      }
      // Reactivate existing assignment
      const { error: updateError } = await supabase
        .from("customer_staff_assignments")
        .update({
          is_active: true,
          permissions: permissions as any,
          assigned_by: session.profile.id,
        })
        .eq("id", existing.id);

      if (updateError) return { success: false, error: updateError.message };

      await logActivity({
        actorId: session.profile.id,
        entityType: "customer_staff_assignment",
        entityId: existing.id,
        action: "reactivate",
        changes: { customerId, staffId, permissions },
      });

      revalidatePath(`/admin/customers/${customerId}`);
      revalidatePath("/admin/customers");
      return { success: true };
    }

    // Insert new assignment
    const { data: inserted, error: insertError } = await supabase
      .from("customer_staff_assignments")
      .insert({
        customer_id: customerId,
        staff_id: staffId,
        assigned_by: session.profile.id,
        permissions: permissions as any,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError) return { success: false, error: insertError.message };

    await logActivity({
      actorId: session.profile.id,
      entityType: "customer_staff_assignment",
      entityId: inserted.id,
      action: "create",
      changes: { customerId, staffId, permissions },
    });

    revalidatePath(`/admin/customers/${customerId}`);
    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true, data: { id: inserted.id } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to assign staff" };
  }
}

/**
 * Admin toggles or revokes staff assignment.
 */
export async function toggleAssignmentAction(formData: FormData): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);

    const rawData = {
      assignmentId: formData.get("assignmentId"),
      isActive: formData.get("isActive") === "true",
    };

    const parsed = assignmentToggleSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { assignmentId, isActive } = parsed.data;
    const supabase = createClient();

    const { data: assignment, error: fetchError } = await supabase
      .from("customer_staff_assignments")
      .select("customer_id, staff_id")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment) {
      return { success: false, error: "Assignment not found" };
    }

    const { error: updateError } = await supabase
      .from("customer_staff_assignments")
      .update({ is_active: isActive })
      .eq("id", assignmentId);

    if (updateError) return { success: false, error: updateError.message };

    await logActivity({
      actorId: session.profile.id,
      entityType: "customer_staff_assignment",
      entityId: assignmentId,
      action: isActive ? "activate" : "deactivate",
      changes: { isActive },
    });

    revalidatePath(`/admin/customers/${assignment.customer_id}`);
    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle assignment" };
  }
}

