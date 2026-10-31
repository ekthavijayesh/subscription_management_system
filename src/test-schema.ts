import { createClient } from "./lib/supabase/server";

export async function testAction() {
  const supabase = createClient();
  const q = supabase.from("profiles").select("role");
  const res = await q;
  const rows = res.data;
  return rows;
}
