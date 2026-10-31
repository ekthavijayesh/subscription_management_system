import { createClient } from "@/lib/supabase/server";

export interface AdminAnalyticsMetrics {
  totalRevenue: number;
  activeSubscriptionsCount: number;
  totalCustomersCount: number;
  overdueInvoicesCount: number;
  overdueAmount: number;
  monthlyRevenue: { month: string; amount: number }[];
  subscriptionBreakdown: { status: string; count: number }[];
}

export interface StaffAnalyticsMetrics {
  assignedCustomerCount: number;
  assignedActiveSubscriptionsCount: number;
  assignedOpenQuotationsCount: number;
  assignedOverdueInvoicesCount: number;
  assignedCollectedRevenue: number;
}

export interface CustomerAnalyticsMetrics {
  activeSubscriptionsCount: number;
  pendingQuotationsCount: number;
  unpaidInvoicesCount: number;
  totalPaidAmount: number;
  nextRenewalDate: string | null;
  nextRenewalAmount: number;
}

/**
 * Derives aggregate metrics for Admin analytics (TASK-056).
 */
export async function getAdminAnalytics(): Promise<AdminAnalyticsMetrics> {
  const supabase = createClient();

  // Run queries in parallel
  const [
    customersRes,
    subscriptionsRes,
    invoicesRes,
    paymentsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id, is_active").eq("role", "customer"),
    supabase.from("subscriptions").select("id, status"),
    supabase.from("invoices").select("id, status, total, due_date"),
    supabase.from("payments").select("id, amount, status, payment_date"),
  ]);

  const customers = customersRes.data || [];
  const subscriptions = subscriptionsRes.data || [];
  const invoices = invoicesRes.data || [];
  const payments = paymentsRes.data || [];

  // Revenue from completed payments
  const totalRevenue = payments
    .filter((p: any) => p.status === "completed")
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const activeSubscriptionsCount = subscriptions.filter(
    (s: any) => s.status === "active"
  ).length;

  const overdueInvoices = invoices.filter(
    (inv: any) => inv.status === "overdue" || (inv.status === "issued" && new Date(inv.due_date) < new Date())
  );

  const overdueAmount = overdueInvoices.reduce(
    (sum: number, inv: any) => sum + Number(inv.total || 0),
    0
  );

  // Group subscriptions by status
  const statusMap: Record<string, number> = {};
  subscriptions.forEach((s: any) => {
    statusMap[s.status] = (statusMap[s.status] || 0) + 1;
  });
  const subscriptionBreakdown = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }));

  // Group payments by month (last 6 months)
  const monthMap: Record<string, number> = {};
  payments
    .filter((p: any) => p.status === "completed")
    .forEach((p: any) => {
      const date = new Date(p.payment_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + Number(p.amount || 0);
    });

  const monthlyRevenue = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));

  return {
    totalRevenue,
    activeSubscriptionsCount,
    totalCustomersCount: customers.length,
    overdueInvoicesCount: overdueInvoices.length,
    overdueAmount,
    monthlyRevenue,
    subscriptionBreakdown,
  };
}

/**
 * Derives scoped metrics for Staff analytics (TASK-057).
 * Strictly scoped to staff-assigned customer accounts.
 */
export async function getStaffAnalytics(staffId: string): Promise<StaffAnalyticsMetrics> {
  const supabase = createClient();

  // Find assigned customer IDs
  const { data: assignments } = await supabase
    .from("customer_staff_assignments")
    .select("customer_id")
    .eq("staff_id", staffId)
    .eq("is_active", true);

  const customerIds = (assignments || []).map((a: any) => a.customer_id);

  if (customerIds.length === 0) {
    return {
      assignedCustomerCount: 0,
      assignedActiveSubscriptionsCount: 0,
      assignedOpenQuotationsCount: 0,
      assignedOverdueInvoicesCount: 0,
      assignedCollectedRevenue: 0,
    };
  }

  const [subscriptionsRes, quotesRes, invoicesRes, paymentsRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, status")
      .in("customer_id", customerIds),
    supabase
      .from("quotations")
      .select("id, status")
      .in("customer_id", customerIds)
      .in("status", ["draft", "sent"]),
    supabase
      .from("invoices")
      .select("id, status, due_date")
      .in("customer_id", customerIds),
    supabase
      .from("payments")
      .select("amount, status, invoice_id")
      .eq("status", "completed"),
  ]);

  const subscriptions = subscriptionsRes.data || [];
  const quotes = quotesRes.data || [];
  const invoices = invoicesRes.data || [];
  const payments = paymentsRes.data || [];

  const invoiceIdSet = new Set(invoices.map((inv: any) => inv.id));
  const assignedCollectedRevenue = payments
    .filter((p: any) => invoiceIdSet.has(p.invoice_id))
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const overdueCount = invoices.filter(
    (inv: any) => inv.status === "overdue" || (inv.status === "issued" && new Date(inv.due_date) < new Date())
  ).length;

  return {
    assignedCustomerCount: customerIds.length,
    assignedActiveSubscriptionsCount: subscriptions.filter((s: any) => s.status === "active").length,
    assignedOpenQuotationsCount: quotes.length,
    assignedOverdueInvoicesCount: overdueCount,
    assignedCollectedRevenue,
  };
}

/**
 * Derives scoped metrics for Customer analytics (TASK-058).
 */
export async function getCustomerAnalytics(customerId: string): Promise<CustomerAnalyticsMetrics> {
  const supabase = createClient();

  const [subscriptionsRes, quotesRes, invoicesRes, paymentsRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, status, current_period_end")
      .eq("customer_id", customerId),
    supabase
      .from("quotations")
      .select("id, status")
      .eq("customer_id", customerId)
      .eq("status", "sent"),
    supabase
      .from("invoices")
      .select("id, status, total")
      .eq("customer_id", customerId),
    supabase
      .from("payments")
      .select("amount, status, invoice_id")
      .eq("status", "completed"),
  ]);

  const subscriptions = subscriptionsRes.data || [];
  const quotes = quotesRes.data || [];
  const invoices = invoicesRes.data || [];
  const payments = paymentsRes.data || [];

  const invoiceIdSet = new Set(invoices.map((inv: any) => inv.id));
  const totalPaidAmount = payments
    .filter((p: any) => invoiceIdSet.has(p.invoice_id))
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const unpaidInvoices = invoices.filter(
    (inv: any) => inv.status === "issued" || inv.status === "overdue"
  );

  // Find nearest next renewal date from active subscriptions
  const activeSubs = subscriptions.filter((s: any) => s.status === "active");
  let nextRenewalDate: string | null = null;
  if (activeSubs.length > 0) {
    const dates = activeSubs
      .map((s: any) => s.current_period_end)
      .filter(Boolean)
      .sort();
    if (dates.length > 0) nextRenewalDate = dates[0];
  }

  return {
    activeSubscriptionsCount: activeSubs.length,
    pendingQuotationsCount: quotes.length,
    unpaidInvoicesCount: unpaidInvoices.length,
    totalPaidAmount,
    nextRenewalDate,
    nextRenewalAmount: unpaidInvoices.reduce((sum: number, i: any) => sum + Number(i.total || 0), 0),
  };
}

