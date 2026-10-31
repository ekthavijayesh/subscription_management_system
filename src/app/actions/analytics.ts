"use server";

/**
 * TASK-055 — Commercial Analytics Server Actions
 */

import { requireRole } from "@/lib/auth/authorization";
import {
  getCommercialMetricsSummary,
  getCommercialActivityStream,
  type CommercialMetricsSummary,
  type ActivityStreamItem,
} from "@/lib/services/analytics-contracts.service";

export interface AnalyticsActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getCommercialMetricsAction(
  currency: string = "USD"
): Promise<AnalyticsActionResult<CommercialMetricsSummary>> {
  try {
    await requireRole(["admin", "staff"]);
    const summary = await getCommercialMetricsSummary(currency);
    return { success: true, data: summary };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load metrics";
    return { success: false, error: message };
  }
}

export async function getCommercialActivityStreamAction(
  limit: number = 50
): Promise<AnalyticsActionResult<ActivityStreamItem[]>> {
  try {
    await requireRole(["admin", "staff"]);
    const stream = await getCommercialActivityStream(limit);
    return { success: true, data: stream };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load activity stream";
    return { success: false, error: message };
  }
}
