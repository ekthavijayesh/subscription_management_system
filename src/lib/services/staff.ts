import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type StaffProfile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getAllStaffMembers(): Promise<StaffProfile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "staff")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as StaffProfile[]) || [];
}

export async function getStaffById(id: string): Promise<StaffProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "staff")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as StaffProfile) || null;
}

