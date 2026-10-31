/**
 * TASK-042 — Renewal Calculation Service (Canonical UTC)
 *
 * Implements deterministic date arithmetic for subscription billing periods:
 * - All calculations are strictly in UTC.
 * - Handles intervals: 'month', 'year', 'week', 'quarter'.
 * - Preserves month-end clamping (e.g., Jan 31 + 1 month -> Feb 28/29, not March 2/3).
 * - Leap year aware (e.g. Feb 29 in leap years).
 * - Computes next period bounds: [nextPeriodStart, nextPeriodEnd].
 * - Invariant: nextPeriodStart is exactly previousPeriodEnd (no gaps, no overlaps).
 * - Note: Grace/proration behavior is intentionally omitted pending policy approval per ektha.md.
 */

export type BillingInterval = "month" | "year" | "week" | "quarter";

export interface PeriodBounds {
  periodStart: string; // ISO 8601 UTC
  periodEnd: string; // ISO 8601 UTC
}

/**
 * Returns the number of days in a given UTC month of a given year.
 */
export function getDaysInUTCMonth(year: number, monthIndex: number): number {
  // monthIndex: 0 = Jan, 1 = Feb, ..., 11 = Dec
  // Date(year, monthIndex + 1, 0) gives the last day of monthIndex
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Adds months to a UTC Date while preserving end-of-month boundaries.
 * E.g., Jan 31 + 1 month = Feb 28 (or Feb 29 in leap year).
 */
export function addUTCMonths(date: Date, months: number): Date {
  const currentDay = date.getUTCDate();
  const currentYear = date.getUTCFullYear();
  const currentMonth = date.getUTCMonth();

  const targetDate = new Date(Date.UTC(currentYear, currentMonth + months, 1));
  const targetYear = targetDate.getUTCFullYear();
  const targetMonth = targetDate.getUTCMonth();

  const daysInTargetMonth = getDaysInUTCMonth(targetYear, targetMonth);
  const targetDay = Math.min(currentDay, daysInTargetMonth);

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
}

/**
 * Calculates the next billing period given an existing period and interval cadence.
 * nextPeriodStart is exactly equal to currentPeriodEnd (continuous coverage, no billing gaps).
 */
export function calculateNextBillingPeriod(params: {
  currentPeriodEnd: string | Date;
  interval: BillingInterval;
  intervalCount?: number;
}): PeriodBounds {
  const count = params.intervalCount ?? 1;
  if (count <= 0) {
    throw new Error("intervalCount must be greater than zero");
  }

  const startDate =
    typeof params.currentPeriodEnd === "string"
      ? new Date(params.currentPeriodEnd)
      : new Date(params.currentPeriodEnd.getTime());

  if (isNaN(startDate.getTime())) {
    throw new Error("Invalid currentPeriodEnd date");
  }

  let endDate: Date;

  switch (params.interval) {
    case "week": {
      endDate = new Date(startDate.getTime() + count * 7 * 24 * 60 * 60 * 1000);
      break;
    }
    case "month": {
      endDate = addUTCMonths(startDate, count);
      break;
    }
    case "quarter": {
      endDate = addUTCMonths(startDate, count * 3);
      break;
    }
    case "year": {
      endDate = addUTCMonths(startDate, count * 12);
      break;
    }
    default: {
      throw new Error(`Unsupported billing interval: ${params.interval}`);
    }
  }

  return {
    periodStart: startDate.toISOString(),
    periodEnd: endDate.toISOString(),
  };
}

/**
 * Validates whether a subscription is currently due for renewal.
 * Invariant: currentPeriodEnd <= now, status === 'active', auto_renew === true.
 */
export function isSubscriptionDueForRenewal(subscription: {
  status: string;
  auto_renew: boolean;
  cancel_at_period_end?: boolean;
  current_period_end: string;
  now?: Date;
}): boolean {
  if (subscription.status !== "active") return false;
  if (!subscription.auto_renew) return false;
  if (subscription.cancel_at_period_end) return false;

  const checkTime = (subscription.now ?? new Date()).getTime();
  const periodEndTime = new Date(subscription.current_period_end).getTime();

  return periodEndTime <= checkTime;
}
