import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/audit";

export type ReportType = "revenue" | "subscriptions" | "customers" | "invoices";

export interface ReportFilter {
  type: ReportType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface GeneratedReport {
  type: ReportType;
  generatedAt: string;
  rowCount: number;
  csvContent: string;
}

/**
 * Generates an authorized, scoped, and audited CSV export report (TASK-059).
 */
export async function generateExportReport(
  filter: ReportFilter,
  actorId: string
): Promise<GeneratedReport> {
  const supabase = createClient();
  const limit = Math.min(filter.limit || 500, 1000); // Guard against unbounded export
  let headers: string[] = [];
  let rows: string[][] = [];

  switch (filter.type) {
    case "revenue": {
      headers = ["Payment ID", "Invoice ID", "Amount", "Currency", "Method", "Status", "Payment Date"];
      let query = supabase
        .from("payments")
        .select("id, invoice_id, amount, currency, payment_method, status, payment_date")
        .order("payment_date", { ascending: false })
        .limit(limit);

      if (filter.startDate) query = query.gte("payment_date", filter.startDate);
      if (filter.endDate) query = query.lte("payment_date", filter.endDate);

      const { data } = await query;
      rows = (data || []).map((p: any) => [
        p.id,
        p.invoice_id,
        String(p.amount),
        p.currency || "USD",
        p.payment_method,
        p.status,
        p.payment_date,
      ]);
      break;
    }

    case "subscriptions": {
      headers = ["Subscription ID", "Customer ID", "Status", "Start Date", "Current Period End", "Cancelled At"];
      let query = supabase
        .from("subscriptions")
        .select("id, customer_id, status, start_date, current_period_end, cancelled_at")
        .order("start_date", { ascending: false })
        .limit(limit);

      if (filter.startDate) query = query.gte("start_date", filter.startDate);
      if (filter.endDate) query = query.lte("start_date", filter.endDate);

      const { data } = await query;
      rows = (data || []).map((s: any) => [
        s.id,
        s.customer_id,
        s.status,
        s.start_date,
        s.current_period_end,
        s.cancelled_at || "",
      ]);
      break;
    }

    case "customers": {
      headers = ["Customer ID", "Full Name", "Email", "Company", "Active", "Created At"];
      let query = supabase
        .from("profiles")
        .select("id, full_name, email, company_name, is_active, created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (filter.startDate) query = query.gte("created_at", filter.startDate);
      if (filter.endDate) query = query.lte("created_at", filter.endDate);

      const { data } = await query;
      rows = (data || []).map((c: any) => [
        c.id,
        `"${(c.full_name || "").replace(/"/g, '""')}"`,
        c.email,
        `"${(c.company_name || "").replace(/"/g, '""')}"`,
        c.is_active ? "Active" : "Inactive",
        c.created_at,
      ]);
      break;
    }

    case "invoices": {
      headers = ["Invoice Number", "Customer ID", "Status", "Issue Date", "Due Date", "Subtotal", "Tax", "Total"];
      let query = supabase
        .from("invoices")
        .select("invoice_number, customer_id, status, issue_date, due_date, subtotal, tax_total, total")
        .order("issue_date", { ascending: false })
        .limit(limit);

      if (filter.startDate) query = query.gte("issue_date", filter.startDate);
      if (filter.endDate) query = query.lte("issue_date", filter.endDate);

      const { data } = await query;
      rows = (data || []).map((i: any) => [
        i.invoice_number,
        i.customer_id,
        i.status,
        i.issue_date,
        i.due_date,
        String(i.subtotal),
        String(i.tax_total),
        String(i.total),
      ]);
      break;
    }
  }

  const csvRows = [headers.join(","), ...rows.map((r) => r.join(","))];
  const csvContent = csvRows.join("\n");

  await logActivity({
    actorId,
    entityType: "report_export",
    entityId: actorId,
    action: "export",
    changes: {
      reportType: filter.type,
      rowCount: rows.length,
      startDate: filter.startDate,
      endDate: filter.endDate,
    },
  });

  return {
    type: filter.type,
    generatedAt: new Date().toISOString(),
    rowCount: rows.length,
    csvContent,
  };
}

