/**
 * TASK-054 — Provider-Neutral Notification Service
 *
 * Requirements:
 * - Provider-neutral queue/template/delivery model.
 * - Supports channels: 'in_app' and 'email'.
 * - Sensitive payload sanitization: masks credit card numbers, auth tokens, passwords, secrets before persisting.
 * - Retry observability: tracks attempts, error messages, and transitions statuses ('unread', 'sent', 'failed', 'read').
 * - RLS-scoped user access: users can only fetch and mark read their own notifications.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface NotificationRecord {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  channel: "in_app" | "email";
  status: "unread" | "read" | "sent" | "failed";
  metadata: Record<string, unknown>;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export type NotificationTemplateType =
  | "quotation_sent"
  | "quotation_approved"
  | "subscription_created"
  | "subscription_renewed"
  | "invoice_issued"
  | "payment_received"
  | "cancellation_decision";

export interface NotificationPayload {
  recipientId: string;
  template: NotificationTemplateType;
  channel?: "in_app" | "email";
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Sensitive payload sanitization
// ---------------------------------------------------------------------------

const SENSITIVE_KEYS = new Set([
  "password",
  "secret",
  "token",
  "authorization",
  "card_number",
  "cvv",
  "pan",
  "service_role",
]);

export function sanitizePayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    const isSensitive =
      SENSITIVE_KEYS.has(lowerKey) ||
      lowerKey.includes("password") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token") ||
      lowerKey.includes("card") ||
      lowerKey.includes("key");

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      sanitized[key] = sanitizePayload(val as Record<string, unknown>);
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized;
}

// ---------------------------------------------------------------------------
// Template rendering
// ---------------------------------------------------------------------------

export function renderNotificationTemplate(
  template: NotificationTemplateType,
  data: Record<string, unknown>
): { title: string; message: string } {
  switch (template) {
    case "quotation_sent":
      return {
        title: `Quotation ${data.quotation_number ?? ""} Ready`,
        message: `Your quotation for ${data.currency ?? "USD"} ${data.total ?? "0.00"} is ready for review.`,
      };
    case "quotation_approved":
      return {
        title: `Quotation ${data.quotation_number ?? ""} Approved`,
        message: `Quotation ${data.quotation_number ?? ""} has been approved.`,
      };
    case "subscription_created":
      return {
        title: "Subscription Activated",
        message: `Subscription ${data.subscription_number ?? ""} is now active.`,
      };
    case "subscription_renewed":
      return {
        title: "Subscription Renewed",
        message: `Your subscription has been renewed through ${data.next_period_end ?? "next cycle"}.`,
      };
    case "invoice_issued":
      return {
        title: `Invoice ${data.invoice_number ?? ""} Issued`,
        message: `Invoice ${data.invoice_number ?? ""} for ${data.currency ?? "USD"} ${data.total ?? "0.00"} is due on ${data.due_date ?? "the due date"}.`,
      };
    case "payment_received":
      return {
        title: "Payment Confirmed",
        message: `Payment of ${data.currency ?? "USD"} ${data.amount ?? "0.00"} has been recorded.`,
      };
    case "cancellation_decision":
      return {
        title: `Cancellation Request ${data.decision ?? ""}`,
        message: `Your cancellation request was ${data.decision}.${data.notes ? ` Reason/Notes: ${data.notes}` : ""}`,
      };
    default:
      return {
        title: "Account Notification",
        message: "You have an update regarding your account.",
      };
  }
}

// ---------------------------------------------------------------------------
// Notification Queue & Dispatch
// ---------------------------------------------------------------------------

export async function queueNotification(
  payload: NotificationPayload
): Promise<NotificationRecord> {
  const supabase = createAdminClient();
  const { title, message } = renderNotificationTemplate(payload.template, payload.data);
  const cleanMetadata = sanitizePayload(payload.data);

  const { data, error } = await (supabase.from("notifications") as any)
    .insert({
      recipient_id: payload.recipientId,
      title,
      message,
      channel: payload.channel ?? "in_app",
      status: "unread",
      metadata: cleanMetadata,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to queue notification: ${error?.message ?? "unknown error"}`);
  }

  return data as unknown as NotificationRecord;
}

export async function listUserNotifications(
  userId: string,
  limit: number = 20
): Promise<NotificationRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load notifications: ${error.message}`);
  }

  return (data as unknown as NotificationRecord[]) ?? [];
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await (supabase.from("notifications") as any)
    .update({
      status: "read",
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("recipient_id", userId);

  if (error) {
    throw new Error(`Failed to mark notification read: ${error.message}`);
  }
}
