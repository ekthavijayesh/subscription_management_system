"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/services/audit";
import { staffInviteSchema, staffUpdateSchema } from "@/lib/validations/staff";

export interface ActionState {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Admin invites / provisions a new staff member (TASK-027).
 * Never exposes secrets or creates insecure users.
 */
export async function inviteStaffAction(formData: FormData): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);

    const rawData = {
      email: formData.get("email"),
      fullName: formData.get("fullName"),
      phone: formData.get("phone") || null,
      role: formData.get("role") || "staff",
    };

    const parsed = staffInviteSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { email, fullName, phone, role } = parsed.data;

    const adminSupabase = createAdminClient();
    const tempPassword = `Staff_${Math.random().toString(36).substring(2, 10)}!9`;

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

    const supabase = createClient();
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        role: role as any,
        is_active: true,
      })
      .eq("id", newUser.user.id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "staff",
      entityId: newUser.user.id,
      action: "invite",
      changes: { email, fullName, role },
    });

    revalidatePath("/admin/staff");
    return { success: true, data: { id: newUser.user.id } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to invite staff" };
  }
}

/**
 * Admin updates staff profile or toggles active status.
 */
export async function updateStaffAction(formData: FormData): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);

    const rawData = {
      id: formData.get("id"),
      fullName: formData.get("fullName"),
      phone: formData.get("phone") || null,
      isActive: formData.get("isActive") === "true",
    };

    const parsed = staffUpdateSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { id, fullName, phone, isActive } = parsed.data;

    // Prevent admin from deactivating self
    if (id === session.profile.id && !isActive) {
      return { success: false, error: "Cannot deactivate your own administrator account" };
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        is_active: isActive,
      })
      .eq("id", id)
      .in("role", ["staff", "admin"]);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await logActivity({
      actorId: session.profile.id,
      entityType: "staff",
      entityId: id,
      action: "update",
      changes: { fullName, phone, isActive },
    });

    revalidatePath("/admin/staff");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update staff" };
  }
}

