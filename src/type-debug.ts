import { createClient } from "./lib/supabase/server";

export async function test() {
  const supabase = createClient();
  const q = supabase.from("profiles").select().eq("id", "123").single();
  const res = await q;
  return res;
}
