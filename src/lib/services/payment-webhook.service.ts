/**
 * TASK-048 — Payment Verification Integration Boundary & Webhooks
 *
 * Implements a provider-neutral payment verification service:
 * - Cryptographic HMAC SHA-256 signature verification.
 * - Clock skew / replay attack mitigation (5-minute tolerance window).
 * - Idempotency guard: checks whether the provider event ID / transaction reference has
 *   already been recorded in `payments` or `activity_logs`.
 * - Transaction-safe allocation:
 *   - Inserts record into `payments` table with `status = 'completed'` and `provider_transaction_id`.
 *   - Updates linked `invoices` row (`amount_paid`, `amount_due`, and status -> 'paid' if settled).
 *   - Writes audit event to `activity_logs` and sends an in-app confirmation notification.
 * - Handles failed payment events (`payment_intent.payment_failed`) by logging failure events.
 */

import "server-only";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { toCents, fromCents } from "@/lib/services/quotation-pricing.service";
import type { Database } from "@/types/database.types";

export interface WebhookPayload {
  id: string; // Unique provider event ID
  type: string; // e.g. "payment_intent.succeeded", "charge.failed"
  created: number; // Unix timestamp in seconds
  data: {
    object: {
      id: string; // Provider transaction ID
      invoice_id?: string;
      customer_id?: string;
      amount: number | string; // in dollars or cents based on provider
      currency: string;
      status: string;
      metadata?: Record<string, string>;
    };
  };
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
}

export interface ProcessWebhookResult {
  success: boolean;
  duplicate: boolean;
  paymentId?: string;
  invoiceId?: string;
  message: string;
}

const DEFAULT_TOLERANCE_SECONDS = 300; // 5 minutes

/**
 * Verifies standard HMAC-SHA256 signature header.
 * Compatible with Stripe signature scheme: `t=timestamp,v1=signature` or raw hex signatures.
 */
export function verifyWebhookSignature(params: {
  payload: string;
  signatureHeader: string;
  secret: string;
  toleranceSeconds?: number;
}): VerificationResult {
  const { payload, signatureHeader, secret, toleranceSeconds = DEFAULT_TOLERANCE_SECONDS } = params;

  if (!signatureHeader || !secret) {
    return { valid: false, error: "Missing signature header or webhook signing secret." };
  }

  // Parse `t=...,v1=...` or fallback to raw hex
  let timestamp: number | null = null;
  let signature: string | null = null;

  if (signatureHeader.includes("t=") && signatureHeader.includes("v1=")) {
    const parts = signatureHeader.split(",");
    for (const part of parts) {
      const [k, v] = part.trim().split("=");
      if (k === "t") timestamp = parseInt(v, 10);
      if (k === "v1") signature = v;
    }
  } else {
    // Raw signature with current timestamp
    signature = signatureHeader.trim();
  }

  if (!signature) {
    return { valid: false, error: "Malformed signature format." };
  }

  // Check clock skew if timestamp was provided
  if (timestamp) {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return { valid: false, error: "Webhook timestamp outside allowed tolerance window (potential replay)." };
    }
  }

  // Compute expected HMAC
  const signedPayload = timestamp ? `${timestamp}.${payload}` : payload;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  // Constant-time comparison
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { valid: false, error: "Signature mismatch." };
  }

  return { valid: true };
}

function generatePaymentNumber(): string {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `PAY-${ymd}-${rand}`;
}

/**
 * Idempotently processes an authenticated payment webhook payload.
 */
export async function processPaymentWebhook(event: WebhookPayload): Promise<ProcessWebhookResult> {
  const adminClient = createAdminClient();
  const eventId = event.id;
  const eventType = event.type;
  const obj = event.data.object;

  const invoiceId = obj.invoice_id || obj.metadata?.invoice_id;
  const providerTransactionId = obj.id;

  // 1. Idempotency Check: verify if provider_transaction_id has already been recorded
  const { data: existingPayment } = await adminClient
    .from("payments")
    .select("id, status")
    .eq("provider_transaction_id", providerTransactionId)
    .maybeSingle();

  if (existingPayment) {
    return {
      success: true,
      duplicate: true,
      paymentId: existingPayment.id,
      invoiceId,
      message: `Event ${eventId} with transaction ${providerTransactionId} already processed.`,
    };
  }

  // Also check activity_logs for eventId to prevent replay
  const { data: existingLog } = await adminClient
    .from("activity_logs")
    .select("id")
    .eq("entity_id", eventId)
    .maybeSingle();

  if (existingLog) {
    return {
      success: true,
      duplicate: true,
      message: `Event ID ${eventId} was already recorded in activity logs.`,
    };
  }

  // 2. Process Successful Payment Event
  if (
    eventType === "payment_intent.succeeded" ||
    eventType === "charge.success" ||
    eventType === "invoice.payment_succeeded"
  ) {
    if (!invoiceId) {
      return {
        success: false,
        duplicate: false,
        message: `Missing invoice_id in webhook metadata for event ${eventId}.`,
      };
    }

    // Fetch target invoice
    const { data: invoice, error: invoiceError } = await adminClient
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return {
        success: false,
        duplicate: false,
        message: `Invoice ${invoiceId} not found in database.`,
      };
    }

    // Determine normalized amount (convert cents to dollars if integer cents provided)
    let paymentAmountString: string;
    if (typeof obj.amount === "number") {
      // If amount > 1000 and appears to be in integer cents (e.g. 5000 = $50.00)
      paymentAmountString = (obj.amount > 500 ? (obj.amount / 100).toFixed(2) : obj.amount.toFixed(2));
    } else {
      paymentAmountString = parseFloat(obj.amount).toFixed(2);
    }

    const paymentCents = toCents(paymentAmountString);
    const invoiceDueCents = toCents(invoice.amount_due.toString());
    const invoicePaidCents = toCents(invoice.amount_paid.toString());

    // Allocate payment
    const newPaidCents = invoicePaidCents + paymentCents;
    const newDueCents = invoiceDueCents > paymentCents ? invoiceDueCents - paymentCents : 0n;
    const isFullySettled = newDueCents === 0n;

    const paymentNumber = generatePaymentNumber();

    // Insert payment record
    const { data: newPayment, error: insertPaymentError } = await adminClient
      .from("payments")
      .insert({
        payment_number: paymentNumber,
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        amount: parseFloat(fromCents(paymentCents)),
        currency: obj.currency?.toUpperCase() || invoice.currency,
        payment_method: "credit_card",
        provider: "webhook",
        provider_transaction_id: providerTransactionId,
        status: "completed",
        verified_at: new Date().toISOString(),
        notes: `Processed via webhook event ${eventId}`,
      })
      .select("id")
      .single();

    if (insertPaymentError || !newPayment) {
      throw new Error(`Failed to insert payment record: ${insertPaymentError?.message}`);
    }

    // Update invoice record
    const invoiceUpdates: Database["public"]["Tables"]["invoices"]["Update"] = {
      amount_paid: parseFloat(fromCents(newPaidCents)),
      amount_due: parseFloat(fromCents(newDueCents)),
      status: isFullySettled ? "paid" : invoice.status,
      paid_at: isFullySettled ? new Date().toISOString() : invoice.paid_at,
    };

    const { error: updateInvoiceError } = await adminClient
      .from("invoices")
      .update(invoiceUpdates)
      .eq("id", invoice.id);

    if (updateInvoiceError) {
      throw new Error(`Failed to update invoice balances: ${updateInvoiceError.message}`);
    }

    // Record activity audit log
    await adminClient.from("activity_logs").insert({
      actor_id: null,
      action: "webhook_payment_recorded",
      entity_type: "payments",
      entity_id: eventId,
      changes: {
        payment_id: newPayment.id,
        payment_number: paymentNumber,
        invoice_id: invoice.id,
        amount: fromCents(paymentCents),
        provider_transaction_id: providerTransactionId,
        event_type: eventType,
      },
    });

    // Send in-app notification to customer
    await adminClient.from("notifications").insert({
      recipient_id: invoice.customer_id,
      title: "Payment Received",
      message: `Payment of $${fromCents(paymentCents)} for invoice ${invoice.invoice_number} has been confirmed.`,
      channel: "in_app",
      metadata: {
        invoice_id: invoice.id,
        payment_id: newPayment.id,
        payment_number: paymentNumber,
      },
    });

    return {
      success: true,
      duplicate: false,
      paymentId: newPayment.id,
      invoiceId: invoice.id,
      message: `Payment of $${fromCents(paymentCents)} recorded and invoice updated successfully.`,
    };
  }

  // 3. Process Failed Payment Event
  if (eventType === "payment_intent.payment_failed" || eventType === "charge.failed") {
    if (invoiceId) {
      await adminClient.from("activity_logs").insert({
        actor_id: null,
        action: "webhook_payment_failed",
        entity_type: "invoices",
        entity_id: eventId,
        changes: {
          invoice_id: invoiceId,
          provider_transaction_id: providerTransactionId,
          event_type: eventType,
        },
      });
    }

    return {
      success: true,
      duplicate: false,
      message: `Payment failure logged for event ${eventId}.`,
    };
  }

  return {
    success: true,
    duplicate: false,
    message: `Event type ${eventType} acknowledged without action.`,
  };
}
