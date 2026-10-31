import { describe, it, expect } from "vitest";
import {
  calculateNextBillingPeriod,
  isSubscriptionDueForRenewal,
  addUTCMonths,
  getDaysInUTCMonth,
} from "@/lib/services/renewal-calculation.service";

describe("Renewal Date & Canonical UTC Service (TASK-042)", () => {
  it("calculates weekly interval correctly in UTC", () => {
    const start = "2026-01-01T00:00:00.000Z";
    const res = calculateNextBillingPeriod({
      currentPeriodEnd: start,
      interval: "week",
      intervalCount: 1,
    });

    expect(res.periodStart).toBe(start);
    expect(res.periodEnd).toBe("2026-01-08T00:00:00.000Z");
  });

  it("calculates 1 month interval correctly in UTC", () => {
    const start = "2026-01-15T12:00:00.000Z";
    const res = calculateNextBillingPeriod({
      currentPeriodEnd: start,
      interval: "month",
      intervalCount: 1,
    });

    expect(res.periodStart).toBe(start);
    expect(res.periodEnd).toBe("2026-02-15T12:00:00.000Z");
  });

  it("clamps month-end correctly for 31-day months to February (non-leap year)", () => {
    const start = "2026-01-31T00:00:00.000Z";
    const res = calculateNextBillingPeriod({
      currentPeriodEnd: start,
      interval: "month",
      intervalCount: 1,
    });

    // 2026 is not a leap year -> Feb has 28 days
    expect(res.periodEnd).toBe("2026-02-28T00:00:00.000Z");
  });

  it("clamps month-end correctly for leap year (2028 Feb 29)", () => {
    const start = "2028-01-31T00:00:00.000Z";
    const res = calculateNextBillingPeriod({
      currentPeriodEnd: start,
      interval: "month",
      intervalCount: 1,
    });

    // 2028 is a leap year -> Feb has 29 days
    expect(res.periodEnd).toBe("2028-02-29T00:00:00.000Z");
  });

  it("calculates quarterly intervals (3 months)", () => {
    const start = "2026-01-01T00:00:00.000Z";
    const res = calculateNextBillingPeriod({
      currentPeriodEnd: start,
      interval: "quarter",
      intervalCount: 1,
    });

    expect(res.periodEnd).toBe("2026-04-01T00:00:00.000Z");
  });

  it("calculates annual intervals (1 year)", () => {
    const start = "2026-03-15T00:00:00.000Z";
    const res = calculateNextBillingPeriod({
      currentPeriodEnd: start,
      interval: "year",
      intervalCount: 1,
    });

    expect(res.periodEnd).toBe("2027-03-15T00:00:00.000Z");
  });

  it("detects subscriptions due for renewal accurately", () => {
    const pastTime = "2026-01-01T00:00:00.000Z";
    const futureTime = "2026-12-31T00:00:00.000Z";
    const now = new Date("2026-06-01T00:00:00.000Z");

    expect(
      isSubscriptionDueForRenewal({
        status: "active",
        auto_renew: true,
        current_period_end: pastTime,
        now,
      })
    ).toBe(true);

    expect(
      isSubscriptionDueForRenewal({
        status: "active",
        auto_renew: true,
        current_period_end: futureTime,
        now,
      })
    ).toBe(false);

    expect(
      isSubscriptionDueForRenewal({
        status: "paused",
        auto_renew: true,
        current_period_end: pastTime,
        now,
      })
    ).toBe(false);

    expect(
      isSubscriptionDueForRenewal({
        status: "active",
        auto_renew: false,
        current_period_end: pastTime,
        now,
      })
    ).toBe(false);

    expect(
      isSubscriptionDueForRenewal({
        status: "active",
        auto_renew: true,
        cancel_at_period_end: true,
        current_period_end: pastTime,
        now,
      })
    ).toBe(false);
  });
});
