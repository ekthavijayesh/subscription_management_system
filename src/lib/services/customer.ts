import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type CustomerProfile = Database["public"]["Tables"]["profiles"]["Row"];

export interface CustomerFilterOptions {
  search?: string;
  isActive?: boolean;
}

/**
 * Returns customers scoped by actor role and assignment.
 * Admin sees all customers.
 * Staff sees only actively assigned customers.
 */
export async function getScopedCustomers(
  actorRole: "admin" | "staff",
  actorId: string,
  options?: CustomerFilterOptions
): Promise<CustomerProfile[]> {
  const supabase = createClient();

  if (actorRole === "admin") {
    let query = supabase
      .from("profiles")
      .select("*")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    if (options?.isActive !== undefined) {
      query = query.eq("is_active", options.isActive);
    }
    if (options?.search) {
      query = query.or(
        `full_name.ilike.%${options.search}%,email.ilike.%${options.search}%,company_name.ilike.%${options.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as CustomerProfile[]) || [];
  }

  // Staff role: must look up actively assigned customer IDs
  const { data: assignments, error: assignError } = await supabase
    .from("customer_staff_assignments")
    .select("customer_id")
    .eq("staff_id", actorId)
    .eq("is_active", true);

  if (assignError) throw new Error(assignError.message);
  const assignedIds = (assignments || []).map((a: any) => a.customer_id);

  if (assignedIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("profiles")
    .select("*")
    .in("id", assignedIds)
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (options?.isActive !== undefined) {
    query = query.eq("is_active", options.isActive);
  }
  if (options?.search) {
    query = query.or(
      `full_name.ilike.%${options.search}%,email.ilike.%${options.search}%,company_name.ilike.%${options.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as CustomerProfile[]) || [];
}

/**
 * Returns customer detail by ID with authorization verification.
 */
export async function getScopedCustomerById(
  customerId: string,
  actorRole: "admin" | "staff" | "customer",
  actorId: string
): Promise<CustomerProfile | null> {
  const supabase = createClient();

  if (actorRole === "customer" && customerId !== actorId) {
    throw new Error("Unauthorized to access this customer record");
  }

  if (actorRole === "staff") {
    // Check active assignment
    const { data: assignment } = await supabase
      .from("customer_staff_assignments")
      .select("id")
      .eq("customer_id", customerId)
      .eq("staff_id", actorId)
      .eq("is_active", true)
      .maybeSingle();

    if (!assignment) {
      throw new Error("You are not assigned to this customer");
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", customerId)
    .eq("role", "customer")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as CustomerProfile) || null;
}

