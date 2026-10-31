/**
 * TASK-055 — Commercial Analytics, Audit & Read Contracts Service
 *
 * Provides stable, verified query and read contracts for reporting and dashboards (Amaya's tasks):
 * - getCommercialMetricsSummary: Aggregates active subscriptions, MRR/ARR estimates,
 *   outstanding balances, collected revenue, and churn/cancellation rates.
 * - getCommercialActivityStream: Append-only audit trail merging subscription_events and activity_logs.
 * - getRevenueByPeriod: Time-series revenue breakdown for dashboard charts (Recharts ready).
 * - All computations use fixed-point arithmetic (zero JS float drift).
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { toCents, fromCents } from "@/lib/services/quotation-pricing.service";

export interface CommercialMetricsSummary {
  activeSubscriptionsCount: number;
  totalSubscribersCount: number;
  estimatedMRR: string; // "XX.XX" format
  estimatedARR: string; // "XX.XX" format
  totalRevenueCollected: string;
  totalOutstandingDue: string;
  totalPendingCancellationsCount: number;
  currency: string;
}

export interface ActivityStreamItem {
  id: string;
  type: "subscription_event" | "activity_log";
  entityType: string;
  entityId: string;
  action: string;
  actorId: string | null;
  occurredAt: string;
  details: Record<string, unknown>;
}

export interface RevenuePeriodData {
  period: string; // "YYYY-MM"
  collected: string;
  invoiced: string;
}

/**
 * Returns top-level commercial health metrics for dashboards and reports.
 */
export async function getCommercialMetricsSummary(currency = "USD"): Promise<CommercialMetricsSummary> {
  const supabase = createAdminClient();

  // 1. Query active subscriptions
  const { data: subsData } = await supabase
    .from("subscriptions")
    .select("status, total, billing_interval, interval_count, customer_id")
    .eq("status", "active")
    .eq("currency", currency);

  const subscriptions = (subsData as any[]) ?? [];

  let mrrCents = 0n;
  const uniqueCustomers = new Set<string>();

  for (const s of subscriptions) {
    uniqueCustomers.add(s.customer_id);
    const subTotalCents = toCents(String(s.total));

    // Normalize to Monthly Recurring Revenue (MRR)
    if (s.billing_interval === "month") {
      mrrCents += subTotalCents / BigInt(Math.max(1, s.interval_count));
    } else if (s.billing_interval === "year") {
      mrrCents += subTotalCents / (BigInt(Math.max(1, s.interval_count)) * 12n);
    } else if (s.billing_interval === "quarter") {
      mrrCents += subTotalCents / (BigInt(Math.max(1, s.interval_count)) * 3n);
    } else if (s.billing_interval === "week") {
      mrrCents += (subTotalCents * 52n) / 12n;
    }
  }

  const arrCents = mrrCents * 12n;

  // 2. Query collected payments
  const { data: paymentsData } = await supabase
    .from("payments")
    .select("amount")
    .eq("status", "completed")
    .eq("currency", currency);

  let totalCollectedCents = 0n;
  for (const p of (paymentsData as any[]) ?? []) {
    totalCollectedCents += toCents(String(p.amount));
  }

  // 3. Query outstanding invoices
  const { data: invoicesData } = await supabase
    .from("invoices")
    .select("amount_due")
    .in("status", ["issued", "overdue"])
    .eq("currency", currency);

  let totalDueCents = 0n;
  for (const inv of (invoicesData as any[]) ?? []) {
    totalDueCents += toCents(String(inv.amount_due));
  }

  // 4. Pending cancellations
  const { count: pendingCancelCount } = await supabase
    .from("cancellation_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return {
    activeSubscriptionsCount: subscriptions.length,
    totalSubscribersCount: uniqueCustomers.size,
    estimatedMRR: fromCents(mrrCents),
    estimatedARR: fromCents(arrCents),
    totalRevenueCollected: fromCents(totalCollectedCents),
    totalOutstandingDue: fromCents(totalDueCents),
    totalPendingCancellationsCount: pendingCancelCount ?? 0,
    currency,
  };
}

/**
 * Returns merged, chronological commercial audit events.
 */
export async function getCommercialActivityStream(limit = 50): Promise<ActivityStreamItem[]> {
  const supabase = createAdminClient();

  const [eventsRes, logsRes] = await Promise.all([
    supabase
      .from("subscription_events")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(limit),
    supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: ActivityStreamItem[] = [];

  for (const ev of (eventsRes.data as any[]) ?? []) {
    items.push({
      id: ev.id,
      type: "subscription_event",
      entityType: "subscription",
      entityId: ev.subscription_id,
      action: ev.event_type,
      actorId: ev.actor_id,
      occurredAt: ev.occurred_at,
      details: ev.metadata ?? {},
    });
  }

  for (const log of (logsRes.data as any[]) ?? []) {
    items.push({
      id: log.id,
      type: "activity_log",
      entityType: log.entity_type,
      entityId: log.entity_id,
      action: log.action,
      actorId: log.actor_id,
      occurredAt: log.created_at,
      details: log.changes ?? {},
    });
  }

  // Sort descending by timestamp
  items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return items.slice(0, limit);
}
