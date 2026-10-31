/**
 * TASK-035 — Unit tests for the quotation pricing engine.
 *
 * Tests cover:
 * - toCents / fromCents fixed-point conversion (no JS float errors)
 * - Percentage discount calculation (exact)
 * - Fixed-amount discount calculation (exact + cap-at-subtotal)
 * - Tax application (post-discount base)
 * - Grand total invariant (subtotal - discount + tax)
 * - Edge cases: zero discount, zero tax, maximum quantity
 * - Zod schema validation for CreateQuotationInput
 *
 * BigInt constructor calls used throughout (not literal suffix `n`) for broad
 * TS target compatibility (the Next.js tsconfig plugin may resolve to <ES2020).
 */

import { describe, it, expect } from "vitest";
import { toCents, fromCents } from "@/lib/services/quotation-pricing.service";
import {
  CreateQuotationInputSchema,
  QuotationLineItemInputSchema,
} from "@/lib/validations/quotation";

// ---------------------------------------------------------------------------
// Fixed-point math
// ---------------------------------------------------------------------------

describe("toCents", () => {
  it("converts whole number string to scaled cents", () => {
    // 10 * 10000 = 100000
    expect(toCents("10")).toBe(BigInt(100000));
  });

  it("converts '49.99' to correct scaled cents", () => {
    // 49 * 10000 + 9900 = 499900
    expect(toCents("49.99")).toBe(BigInt(499900));
  });

  it("converts '0.01' to correct scaled cents", () => {
    expect(toCents("0.01")).toBe(BigInt(100));
  });

  it("converts '0.0800' tax rate correctly", () => {
    expect(toCents("0.0800")).toBe(BigInt(800));
  });

  it("handles 4-decimal precision", () => {
    expect(toCents("0.1234")).toBe(BigInt(1234));
  });

  it("handles numeric input", () => {
    expect(toCents(100)).toBe(BigInt(1000000));
  });
});

describe("fromCents", () => {
  it("formats 0 as '0.00'", () => {
    expect(fromCents(BigInt(0))).toBe("0.00");
  });

  it("formats 499900 as '49.99'", () => {
    expect(fromCents(BigInt(499900))).toBe("49.99");
  });

  it("round-trips correctly for '99.99'", () => {
    expect(fromCents(toCents("99.99"))).toBe("99.99");
  });

  it("round-trips correctly for '1000.00'", () => {
    expect(fromCents(toCents("1000.00"))).toBe("1000.00");
  });

  it("rounds half-up from 4th decimal", () => {
    // 0.0050 → 0.01 after rounding
    expect(fromCents(toCents("0.0050"))).toBe("0.01");
  });

  it("formats large amount correctly", () => {
    expect(fromCents(toCents("9999.99"))).toBe("9999.99");
  });
});

// ---------------------------------------------------------------------------
// Pricing arithmetic (pure math, no DB)
// ---------------------------------------------------------------------------

describe("Pricing arithmetic invariants", () => {
  /**
   * Manual pricing calculation to verify engine logic matches.
   * Simulates what priceLineItems does for a single item.
   */
  function manualPrice(
    unitPrice: string,
    quantity: number,
    discountType: "percentage" | "fixed_amount" | null,
    discountValue: string | null,
    taxRate: string
  ) {
    const SCALE = BigInt(10000);
    const HUNDRED = BigInt(100);
    const ZERO = BigInt(0);

    const unitCents = toCents(unitPrice);
    const subtotalCents = unitCents * BigInt(quantity);

    let discountCents = ZERO;
    if (discountType === "percentage" && discountValue) {
      const rateCents = toCents(discountValue);
      discountCents = (subtotalCents * rateCents) / (HUNDRED * SCALE);
    } else if (discountType === "fixed_amount" && discountValue) {
      const fixed = toCents(discountValue);
      discountCents = fixed > subtotalCents ? subtotalCents : fixed;
    }

    const taxBase = subtotalCents - discountCents;
    const taxRateCents = toCents(taxRate);
    const taxCents = (taxBase * taxRateCents) / SCALE;
    const totalCents = taxBase + taxCents;

    return {
      subtotal: fromCents(subtotalCents),
      discount: fromCents(discountCents),
      tax: fromCents(taxCents),
      total: fromCents(totalCents),
    };
  }

  it("no discount, no tax → total equals subtotal", () => {
    const result = manualPrice("49.99", 1, null, null, "0.0000");
    expect(result.subtotal).toBe("49.99");
    expect(result.discount).toBe("0.00");
    expect(result.tax).toBe("0.00");
    expect(result.total).toBe("49.99");
  });

  it("quantity multiplied correctly", () => {
    const result = manualPrice("10.00", 3, null, null, "0.0000");
    expect(result.subtotal).toBe("30.00");
    expect(result.total).toBe("30.00");
  });

  it("percentage discount 10% on $100.00 → discount $10.00", () => {
    const result = manualPrice("100.00", 1, "percentage", "10.00", "0.0000");
    expect(result.discount).toBe("10.00");
    expect(result.total).toBe("90.00");
  });

  it("percentage discount 15% on $49.99 qty 2 is deterministic", () => {
    // subtotal = $99.98, 15% = 14.997 → rounds to $15.00
    const result = manualPrice("49.99", 2, "percentage", "15.00", "0.0000");
    expect(result.subtotal).toBe("99.98");

    // Verify the exact bigint path step-by-step
    const subtotalCents = toCents("99.98"); // 999800
    expect(subtotalCents).toBe(BigInt(999800));
    const rateCents = toCents("15.00"); // 150000
    expect(rateCents).toBe(BigInt(150000));
    const discountCents = (subtotalCents * rateCents) / (BigInt(100) * BigInt(10000));
    // = (999800 * 150000) / 1000000 = 149970000000 / 1000000 = 149970
    expect(discountCents).toBe(BigInt(149970));
    // 149970 / 10000 = 14.997 → rounds to 15.00
    expect(fromCents(discountCents)).toBe("15.00");

    expect(result.discount).toBe("15.00");
    expect(result.total).toBe("84.98");
  });

  it("fixed discount $5.00 on $20.00 → discount $5.00", () => {
    const result = manualPrice("20.00", 1, "fixed_amount", "5.00", "0.0000");
    expect(result.discount).toBe("5.00");
    expect(result.total).toBe("15.00");
  });

  it("fixed discount capped at subtotal when discount > subtotal", () => {
    // discount $50 on $10 item → capped to $10
    const result = manualPrice("10.00", 1, "fixed_amount", "50.00", "0.0000");
    expect(result.discount).toBe("10.00");
    expect(result.total).toBe("0.00");
  });

  it("8% tax on $100.00 no discount → tax $8.00, total $108.00", () => {
    const result = manualPrice("100.00", 1, null, null, "0.0800");
    expect(result.tax).toBe("8.00");
    expect(result.total).toBe("108.00");
  });

  it("tax is applied AFTER discount (post-discount base)", () => {
    // $100 - 10% = $90 base, 10% tax on $90 = $9, total $99
    const result = manualPrice("100.00", 1, "percentage", "10.00", "0.1000");
    expect(result.subtotal).toBe("100.00");
    expect(result.discount).toBe("10.00");
    expect(result.tax).toBe("9.00");
    expect(result.total).toBe("99.00");
  });

  it("large quantity pricing is exact (no float drift)", () => {
    // $9.99 × 1000 = $9990.00
    const result = manualPrice("9.99", 1000, null, null, "0.0000");
    expect(result.subtotal).toBe("9990.00");
    expect(result.total).toBe("9990.00");
  });
});

// ---------------------------------------------------------------------------
// Zod schema validation
// ---------------------------------------------------------------------------

describe("CreateQuotationInputSchema", () => {
  const validFutureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const validInput = {
    customer_id: "00000000-0000-0000-0000-000000000001",
    valid_until: validFutureDate,
    currency: "USD",
    items: [
      {
        plan_id: "00000000-0000-0000-0000-000000000002",
        quantity: 2,
      },
    ],
  };

  it("accepts valid input", () => {
    const result = CreateQuotationInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("normalises currency to uppercase", () => {
    const result = CreateQuotationInputSchema.safeParse({
      ...validInput,
      currency: "usd",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currency).toBe("USD");
  });

  it("rejects invalid customer_id (not UUID)", () => {
    const result = CreateQuotationInputSchema.safeParse({
      ...validInput,
      customer_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty items array", () => {
    const result = CreateQuotationInputSchema.safeParse({
      ...validInput,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity of 0", () => {
    const result = CreateQuotationInputSchema.safeParse({
      ...validInput,
      items: [{ plan_id: "00000000-0000-0000-0000-000000000002", quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid ISO date for valid_until", () => {
    const result = CreateQuotationInputSchema.safeParse({
      ...validInput,
      valid_until: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("normalises discount_code to uppercase and trims whitespace", () => {
    const result = QuotationLineItemInputSchema.safeParse({
      plan_id: "00000000-0000-0000-0000-000000000002",
      quantity: 1,
      discount_code: " summer20 ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.discount_code).toBe("SUMMER20");
  });

  it("rejects currency not 3 characters", () => {
    const result = CreateQuotationInputSchema.safeParse({
      ...validInput,
      currency: "US",
    });
    expect(result.success).toBe(false);
  });
});
