import { describe, it, expect } from "vitest";
import { toCents, fromCents } from "@/lib/services/quotation-pricing.service";
import { validateQuotationTransition, QuotationStateError } from "@/lib/services/quotation-state.service";
import { validateSubscriptionTransition, SubscriptionStateError } from "@/lib/services/subscription-state.service";
import { calculateNextBillingPeriod } from "@/lib/services/renewal-calculation.service";
import { assertInvoiceMutable } from "@/lib/services/invoice-state.service";
import { verifyWebhookSignature } from "@/lib/services/payment-webhook.service";
import crypto from "crypto";

describe("Commercial Lifecycle End-to-End Integration (TASK-060)", () => {
  const futureDate = new Date(Date.now() + 86400000).toISOString();

  it("executes complete pricing math -> quotation -> subscription -> renewal -> invoice -> webhook verification", () => {
    // 1. Price line items with deterministic exact cents math (no floating point errors)
    const unitPrice = "49.99";
    const quantity = 3;
    const unitPriceCents = toCents(unitPrice);
    const subtotalCents = unitPriceCents * BigInt(quantity);
    expect(fromCents(subtotalCents)).toBe("149.97");

    // 2. Validate Quotation State Transitions
    // draft -> sent: allowed for staff and admin
    const quoteSent = validateQuotationTransition({
      currentStatus: "draft",
      action: "send",
      userRole: "staff",
      validUntil: futureDate,
    });
    expect(quoteSent.nextStatus).toBe("sent");

    // customer cannot send quote
    expect(() =>
      validateQuotationTransition({
        currentStatus: "draft",
        action: "send",
        userRole: "customer",
        validUntil: futureDate,
      })
    ).toThrowError(QuotationStateError);

    // sent -> approved: allowed for customer
    const quoteApproved = validateQuotationTransition({
      currentStatus: "sent",
      action: "approve",
      userRole: "customer",
      validUntil: futureDate,
    });
    expect(quoteApproved.nextStatus).toBe("approved");

    // approved -> converted: allowed for staff
    const quoteConverted = validateQuotationTransition({
      currentStatus: "approved",
      action: "convert",
      userRole: "staff",
      validUntil: futureDate,
    });
    expect(quoteConverted.nextStatus).toBe("converted");

    // 3. Subscription Lifecycle State Machine
    // active -> paused: allowed for staff
    const subPaused = validateSubscriptionTransition({
      currentStatus: "active",
      action: "pause",
      userRole: "staff",
    });
    expect(subPaused.nextStatus).toBe("paused");

    // customer cannot directly pause/cancel
    expect(() =>
      validateSubscriptionTransition({
        currentStatus: "active",
        action: "cancel",
        userRole: "customer",
      })
    ).toThrowError(SubscriptionStateError);

    // 4. Renewal Date Calculation across Leap Year & Month-End
    const janPeriod = calculateNextBillingPeriod({
      currentPeriodEnd: "2024-01-31T00:00:00.000Z",
      interval: "month",
      intervalCount: 1,
    });
    // Leap year 2024: Jan 31 + 1 month clamps to Feb 29
    expect(janPeriod.periodEnd).toBe("2024-02-29T00:00:00.000Z");

    // 5. Invoice Document Immutability Guard
    // Draft invoices are mutable
    expect(() => assertInvoiceMutable("draft")).not.toThrow();

    // Issued / Paid invoices reject modification
    expect(() => assertInvoiceMutable("issued")).toThrowError(/strictly immutable/);
    expect(() => assertInvoiceMutable("paid")).toThrowError(/strictly immutable/);

    // 6. Payment Webhook Signature Boundary Verification
    const secret = "whsec_super_secret_test_key";
    const body = JSON.stringify({ event: "invoice.paid", id: "evt_9988" });
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");

    const verification = verifyWebhookSignature({
      payload: body,
      signatureHeader: sig,
      secret,
    });
    expect(verification.valid).toBe(true);
  });
});
