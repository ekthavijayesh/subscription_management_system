/**
 * TASK-045 — Server-Side Invoice Document & Download Audit Route
 *
 * Implements authorized, server-rendered invoice documents:
 * - Authenticates request session (requireAuth).
 * - Enforces role-based permissions: customers can only view their own invoice; staff/admin can view all.
 * - Records download activity audit in `activity_logs`.
 * - Renders a clean, standalone, printable HTML document designed for print-to-PDF.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInvoiceById } from "@/lib/services/invoicing.service";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Check profile
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = profileRaw as { role: string } | null;
  const userRole = profile?.role ?? "customer";

  const invoice = await getInvoiceById(params.id);
  if (!invoice) {
    return new NextResponse("Invoice Not Found", { status: 404 });
  }

  // Permission check: customer can only view own invoice
  if (userRole === "customer" && invoice.customer_id !== user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Audit log the download/export event
  try {
    await (supabase.from("activity_logs") as any).insert({
      actor_id: user.id,
      entity_type: "invoice",
      entity_id: invoice.id,
      action: "invoice_pdf_viewed",
      changes: {
        invoice_number: invoice.invoice_number,
        downloaded_at: new Date().toISOString(),
      },
    });
  } catch (logErr) {
    console.error("Non-fatal download audit logging error:", logErr);
  }

  // Render standalone printable document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #111; line-height: 1.5; font-size: 14px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 28px; font-weight: bold; margin: 0; color: #0f172a; }
    .meta { text-align: right; font-size: 13px; color: #64748b; }
    .grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; width: 45%; }
    .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; padding: 10px; background: #f1f5f9; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .text-right { text-align: right; }
    .totals { margin-top: 25px; margin-left: auto; width: 300px; text-align: right; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 6px; }
    .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #eee; padding-top: 20px; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #0f172a; color: white; border: none; border-radius: 4px; cursor: pointer;">
      Print / Save to PDF
    </button>
  </div>

  <div class="header">
    <div>
      <h1 class="title">INVOICE</h1>
      <p style="margin: 4px 0 0 0; color: #475569; font-weight: 500;">${invoice.invoice_number}</p>
    </div>
    <div class="meta">
      <div><strong>Status:</strong> ${invoice.status.toUpperCase()}</div>
      <div><strong>Issued Date:</strong> ${new Date(invoice.issued_at).toLocaleDateString()}</div>
      <div><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Billed To</div>
      <div style="font-family: monospace; font-size: 12px;">Customer ID: ${invoice.customer_id}</div>
    </div>
    <div class="card">
      <div class="card-title">Billing Period (UTC)</div>
      <div>${new Date(invoice.billing_period_start).toLocaleDateString()} &mdash; ${new Date(invoice.billing_period_end).toLocaleDateString()}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Discount</th>
        <th class="text-right">Tax</th>
        <th class="text-right">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items
        .map(
          (item) => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${invoice.currency} ${item.unit_price}</td>
          <td class="text-right">${invoice.currency} ${item.discount_amount}</td>
          <td class="text-right">${invoice.currency} ${item.tax_amount}</td>
          <td class="text-right font-medium">${invoice.currency} ${item.line_total}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal:</span> <span>${invoice.currency} ${invoice.subtotal}</span></div>
    <div><span>Discounts:</span> <span>-${invoice.currency} ${invoice.discount_total}</span></div>
    <div><span>Tax:</span> <span>+${invoice.currency} ${invoice.tax_total}</span></div>
    <div class="grand-total"><span>Total:</span> <span>${invoice.currency} ${invoice.total}</span></div>
    <div style="margin-top: 10px; color: #64748b;"><span>Amount Paid:</span> <span>${invoice.currency} ${invoice.amount_paid}</span></div>
    <div style="font-weight: bold; color: ${invoice.amount_due === "0.00" ? "#16a34a" : "#dc2626"};">
      <span>Amount Due:</span> <span>${invoice.currency} ${invoice.amount_due}</span>
    </div>
  </div>

  <div class="footer">
    Thank you for your business. For any questions, please contact billing support.
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
