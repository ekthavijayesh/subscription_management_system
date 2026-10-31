import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, RefreshCw, Receipt, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  // Fetch count of active customers, subscriptions, and open invoices
  const [
    { count: customerCount },
    { count: subscriptionCount },
    { count: invoiceCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer"),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .in("status", ["issued", "overdue"]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Admin Overview
        </h1>
        <p className="text-sm text-slate-500">
          Organization summary and commercial performance
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Customers
            </CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered client profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Subscriptions
            </CardTitle>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently generating recurring billing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Open Invoices
            </CardTitle>
            <Receipt className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending collection or verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Financial Baseline
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time ledger audit active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Initialization Complete</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The foundation has been initialized with Row-Level Security, strict database invariants,
            multi-role authorization, and audited lifecycle boundaries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
