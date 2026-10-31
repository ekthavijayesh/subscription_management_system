/**
 * TASK-052 — Automated Billing Engine & Work Selector
 *
 * Implements automated billing runs:
 * - Selects active subscriptions whose current_period_end <= now and auto_renew = true.
 * - Idempotent invoice generation for the new period.
 * - Supports dry-run mode (returns work list and preview totals without writing changes).
 * - Records billing run results and execution observability in activity_logs.
 * - Enforces server-only execution (never triggered directly from unauthenticated client browsers).
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateNextBillingPeriod } from "@/lib/services/renewal-calculation.service";
import { generateSubscriptionInvoice } from "@/lib/services/invoicing.service";
import type { SubscriptionRecord } from "@/lib/services/subscription.service";

export interface BillingRunResult {
  runId: string;
  isDryRun: boolean;
  timestamp: string;
  processedCount: number;
  invoicesGenerated: number;
  skippedCount: number;
  errors: { subscriptionId: string; error: string }[];
  summary: {
    subscriptionId: string;
    subscriptionNumber: string;
    periodStart: string;
    periodEnd: string;
    total: string;
    invoiceStatus: "created" | "already_exists" | "dry_run";
  }[];
}

export async function executeAutomatedBillingRun(params: {
  isDryRun?: boolean;
  limit?: number;
}): Promise<BillingRunResult> {
  const isDryRun = params.isDryRun ?? false;
  const limit = params.limit ?? 50;
  const now = new Date();
  const nowISO = now.toISOString();
  const runId = `BILL-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  // Admin client bypasses client RLS to select all active due subscriptions
  const supabase = createAdminClient();

  // 1. Repeat-safe work selection: active, auto_renew=true, !cancel_at_period_end, period_end <= now
  const { data: dueSubsData, error: subsError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .eq("auto_renew", true)
    .eq("cancel_at_period_end", false)
    .lte("current_period_end", nowISO)
    .limit(limit);

  if (subsError) {
    throw new Error(`Failed to query subscriptions for billing run: ${subsError.message}`);
  }

  const dueSubscriptions = (dueSubsData as unknown as SubscriptionRecord[]) ?? [];

  const result: BillingRunResult = {
    runId,
    isDryRun,
    timestamp: nowISO,
    processedCount: dueSubscriptions.length,
    invoicesGenerated: 0,
    skippedCount: 0,
    errors: [],
    summary: [],
  };

  // 2. Process work items
  for (const sub of dueSubscriptions) {
    try {
      // Calculate next billing period
      const nextPeriod = calculateNextBillingPeriod({
        currentPeriodEnd: sub.current_period_end,
        interval: sub.billing_interval,
        intervalCount: sub.interval_count,
      });

      if (isDryRun) {
        result.summary.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscription_number,
          periodStart: nextPeriod.periodStart,
          periodEnd: nextPeriod.periodEnd,
          total: sub.total,
          invoiceStatus: "dry_run",
        });
        continue;
      }

      // Generate invoice for the new period (enforces UNIQUE uq_subscription_billing_period)
      const { invoice, isExisting } = await generateSubscriptionInvoice({
        subscriptionId: sub.id,
        billingPeriodStart: nextPeriod.periodStart,
        billingPeriodEnd: nextPeriod.periodEnd,
        actorId: undefined, // Automated/System run
      });

      if (isExisting) {
        result.skippedCount++;
      } else {
        result.invoicesGenerated++;
      }

      result.summary.push({
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscription_number,
        periodStart: nextPeriod.periodStart,
        periodEnd: nextPeriod.periodEnd,
        total: invoice.total,
        invoiceStatus: isExisting ? "already_exists" : "created",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Billing failed";
      result.errors.push({
        subscriptionId: sub.id,
        error: msg,
      });
    }
  }

  // 3. Observability log
  try {
    await (supabase.from("activity_logs") as any).insert({
      actor_id: null,
      entity_type: "billing_run",
      entity_id: runId,
      action: isDryRun ? "billing_run_dry_run" : "billing_run_executed",
      changes: {
        run_id: runId,
        processed: result.processedCount,
        invoices_generated: result.invoicesGenerated,
        skipped: result.skippedCount,
        errors_count: result.errors.length,
      },
    });
  } catch (logErr) {
    console.error("Non-fatal billing run audit error:", logErr);
  }

  return result;
}
