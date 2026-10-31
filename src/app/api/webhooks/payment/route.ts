/**
 * TASK-048 — Payment Webhook Route Handler
 *
 * Narrow server-only endpoint for receiving incoming payment provider webhooks.
 * - Restricts access to POST method only.
 * - Verifies HMAC SHA-256 signatures with replay protection.
 * - Idempotently processes payment settlements and failures.
 * - Bypasses client execution; uses server-only admin client.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, processPaymentWebhook, type WebhookPayload } from "@/lib/services/payment-webhook.service";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader =
      request.headers.get("stripe-signature") ||
      request.headers.get("x-webhook-signature") ||
      request.headers.get("x-signature") ||
      "";

    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.CRON_SECRET || "";

    // 1. Signature Verification
    if (webhookSecret) {
      const verification = verifyWebhookSignature({
        payload: rawBody,
        signatureHeader,
        secret: webhookSecret,
      });

      if (!verification.valid) {
        return NextResponse.json(
          { error: verification.error ?? "Invalid signature" },
          { status: 400 }
        );
      }
    }

    // 2. Parse Webhook Event Payload
    let event: WebhookPayload;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
    }

    if (!event.id || !event.type || !event.data?.object) {
      return NextResponse.json(
        { error: "Missing required webhook event structure (id, type, data.object)" },
        { status: 400 }
      );
    }

    // 3. Process Event Idempotently
    const result = await processPaymentWebhook(event);

    return NextResponse.json({
      received: true,
      duplicate: result.duplicate,
      message: result.message,
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Internal server error while processing webhook" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}
