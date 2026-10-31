import { describe, it, expect } from "vitest";
import {
  validateSubscriptionTransition,
  SubscriptionStateError,
} from "@/lib/services/subscription-state.service";

describe("Subscription Lifecycle State Machine", () => {
  it("allows staff to pause an active subscription", () => {
    const res = validateSubscriptionTransition({
      currentStatus: "active",
      action: "pause",
      userRole: "staff",
    });
    expect(res.nextStatus).toBe("paused");
  });

  it("allows staff to resume a paused subscription", () => {
    const res = validateSubscriptionTransition({
      currentStatus: "paused",
      action: "resume",
      userRole: "admin",
    });
    expect(res.nextStatus).toBe("active");
  });

  it("prevents customer from directly pausing or cancelling a subscription", () => {
    expect(() =>
      validateSubscriptionTransition({
        currentStatus: "active",
        action: "pause",
        userRole: "customer",
      })
    ).toThrowError(SubscriptionStateError);

    expect(() =>
      validateSubscriptionTransition({
        currentStatus: "active",
        action: "cancel",
        userRole: "customer",
      })
    ).toThrowError(SubscriptionStateError);
  });

  it("handles past_due lifecycle transitions correctly", () => {
    const res1 = validateSubscriptionTransition({
      currentStatus: "active",
      action: "mark_past_due",
      userRole: "staff",
    });
    expect(res1.nextStatus).toBe("past_due");

    const res2 = validateSubscriptionTransition({
      currentStatus: "past_due",
      action: "cure_past_due",
      userRole: "staff",
    });
    expect(res2.nextStatus).toBe("active");
  });

  it("prevents invalid transitions out of terminal states (cancelled/expired)", () => {
    expect(() =>
      validateSubscriptionTransition({
        currentStatus: "cancelled",
        action: "resume",
        userRole: "staff",
      })
    ).toThrowError(/Cannot transition/);

    expect(() =>
      validateSubscriptionTransition({
        currentStatus: "expired",
        action: "pause",
        userRole: "admin",
      })
    ).toThrowError(/Cannot transition/);
  });
});
