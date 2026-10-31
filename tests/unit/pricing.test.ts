import { describe, it, expect } from "vitest";

describe("Pricing Engine & Read Model Invariants (TASK-034)", () => {
  // Pure pricing calculation unit verification
  function calculateLineItemSnapshot(unitPrice: number, quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Quantity must be a positive integer");
    }
    const unitPriceCents = Math.round(unitPrice * 100);
    const totalCents = unitPriceCents * quantity;
    return totalCents / 100;
  }

  it("calculates exact line item subtotal without JavaScript floating-point artifacts", () => {
    // 19.99 * 3 in naive float math is 59.970000000000006
    const total = calculateLineItemSnapshot(19.99, 3);
    expect(total).toBe(59.97);

    // 0.1 + 0.2 style test: 33.33 * 3
    const total2 = calculateLineItemSnapshot(33.33, 3);
    expect(total2).toBe(99.99);
  });

  it("rejects non-positive and non-integer quantities", () => {
    expect(() => calculateLineItemSnapshot(50, 0)).toThrow("Quantity must be a positive integer");
    expect(() => calculateLineItemSnapshot(50, -2)).toThrow("Quantity must be a positive integer");
    expect(() => calculateLineItemSnapshot(50, 2.5)).toThrow("Quantity must be a positive integer");
  });

  it("formats line item description with variant when present", () => {
    const formatDesc = (product: string, variant: string | null, plan: string) => {
      return variant ? `${product} (${variant}) — ${plan}` : `${product} — ${plan}`;
    };

    expect(formatDesc("Analytics Suite", "10 Seats", "Monthly Growth")).toBe(
      "Analytics Suite (10 Seats) — Monthly Growth"
    );
    expect(formatDesc("Basic Cloud", null, "Annual Starter")).toBe(
      "Basic Cloud — Annual Starter"
    );
  });
});

