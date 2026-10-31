import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyWebhookSignature } from "@/lib/services/payment-webhook.service";

describe("Payment Webhook Signature Verification (TASK-048)", () => {
  const secret = "whsec_test_secret_1234567890abcdef";
  const payload = JSON.stringify({
    id: "evt_test_123",
    type: "payment_intent.succeeded",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: "pi_12345",
        amount: 2500,
        currency: "USD",
        status: "succeeded",
      },
    },
  });

  it("verifies valid raw HMAC-SHA256 signature", () => {
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const result = verifyWebhookSignature({
      payload,
      signatureHeader: expected,
      secret,
    });

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("verifies valid Stripe-style t=timestamp,v1=signature header", () => {
    const now = Math.floor(Date.now() / 1000);
    const signedPayload = `${now}.${payload}`;
    const sig = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
    const header = `t=${now},v1=${sig}`;

    const result = verifyWebhookSignature({
      payload,
      signatureHeader: header,
      secret,
    });

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects mismatched signature", () => {
    const result = verifyWebhookSignature({
      payload,
      signatureHeader: "bad_signature_deadbeef1234567890abcdef",
      secret,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects expired timestamp (replay attack mitigation)", () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago (> 5 min tolerance)
    const signedPayload = `${oldTimestamp}.${payload}`;
    const sig = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
    const header = `t=${oldTimestamp},v1=${sig}`;

    const result = verifyWebhookSignature({
      payload,
      signatureHeader: header,
      secret,
      toleranceSeconds: 300,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("tolerance window");
  });

  it("fails safely when secret or signature header is missing", () => {
    const result = verifyWebhookSignature({
      payload,
      signatureHeader: "",
      secret,
    });
    expect(result.valid).toBe(false);

    const resultNoSecret = verifyWebhookSignature({
      payload,
      signatureHeader: "some_sig",
      secret: "",
    });
    expect(resultNoSecret.valid).toBe(false);
  });
});
