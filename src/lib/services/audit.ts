import { createClient } from "@/lib/supabase/server";

export interface LogActivityParams {
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, any>;
  ipAddress?: string | null;
}

/**
 * Appends an immutable audit record to the activity_logs table.
 */
export async function logActivity({
  actorId,
  entityType,
  entityId,
  action,
  changes = {},
  ipAddress = null,
}: LogActivityParams): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("activity_logs").insert({
      actor_id: actorId ?? null,
      entity_type: entityType,
      entity_id: entityId,
      action,
      changes: changes as any,
      ip_address: ipAddress,
    });
  } catch (error) {
    // Fail-safe: do not crash user requests on audit failure, but log to server console
    console.error("Failed to record activity audit log:", error);
  }
}

