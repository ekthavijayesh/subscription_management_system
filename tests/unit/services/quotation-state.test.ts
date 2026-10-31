import { describe, it, expect } from "vitest";
import {
  validateQuotationTransition,
  QuotationStateError,
} from "@/lib/services/quotation-state.service";

describe("Quotation State Machine", () => {
  const futureDate = new Date(Date.now() + 86400000).toISOString();
  const pastDate = new Date(Date.now() - 86400000).toISOString();

  it("allows staff to send a draft quote with future valid_until", () => {
    const res = validateQuotationTransition({
      currentStatus: "draft",
      action: "send",
      userRole: "staff",
      validUntil: futureDate,
    });
    expect(res.nextStatus).toBe("sent");
  });

  it("prevents customer from sending a draft quote", () => {
    expect(() =>
      validateQuotationTransition({
        currentStatus: "draft",
        action: "send",
        userRole: "customer",
        validUntil: futureDate,
      })
    ).toThrowError(QuotationStateError);
  });

  it("prevents sending an expired draft quote", () => {
    expect(() =>
      validateQuotationTransition({
        currentStatus: "draft",
        action: "send",
        userRole: "staff",
        validUntil: pastDate,
      })
    ).toThrowError(QuotationStateError);
  });

  it("allows customer to approve a sent quote before expiration", () => {
    const res = validateQuotationTransition({
      currentStatus: "sent",
      action: "approve",
      userRole: "customer",
      validUntil: futureDate,
    });
    expect(res.nextStatus).toBe("approved");
  });

  it("prevents customer from approving an expired sent quote", () => {
    expect(() =>
      validateQuotationTransition({
        currentStatus: "sent",
        action: "approve",
        userRole: "customer",
        validUntil: pastDate,
      })
    ).toThrowError(/expired/i);
  });

  it("allows customer or staff to reject a sent quote", () => {
    const res1 = validateQuotationTransition({
      currentStatus: "sent",
      action: "reject",
      userRole: "customer",
      validUntil: futureDate,
    });
    expect(res1.nextStatus).toBe("rejected");

    const res2 = validateQuotationTransition({
      currentStatus: "sent",
      action: "reject",
      userRole: "staff",
      validUntil: futureDate,
    });
    expect(res2.nextStatus).toBe("rejected");
  });

  it("disallows invalid transitions (e.g., draft directly to approved)", () => {
    expect(() =>
      validateQuotationTransition({
        currentStatus: "draft",
        action: "approve",
        userRole: "staff",
        validUntil: futureDate,
      })
    ).toThrowError(/Cannot transition/);
  });

  it("allows expire action only when past expiration date", () => {
    expect(() =>
      validateQuotationTransition({
        currentStatus: "sent",
        action: "expire",
        userRole: "staff",
        validUntil: futureDate,
      })
    ).toThrowError(/cannot expire yet/);

    const res = validateQuotationTransition({
      currentStatus: "sent",
      action: "expire",
      userRole: "staff",
      validUntil: pastDate,
    });
    expect(res.nextStatus).toBe("expired");
  });

  it("prevents modifying terminal states (e.g. rejected -> approved)", () => {
    expect(() =>
      validateQuotationTransition({
        currentStatus: "rejected",
        action: "approve",
        userRole: "staff",
        validUntil: futureDate,
      })
    ).toThrowError(QuotationStateError);
  });
});
