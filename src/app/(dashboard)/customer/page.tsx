import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Receipt, FileText } from "lucide-react";

export default async function CustomerDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { count: subscriptionCount },
    { count: quotationCount },
    { count: invoiceCount },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", user?.id ?? "")
      .eq("status", "active"),
    supabase
      .from("quotations")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", user?.id ?? "")
      .eq("status", "sent"),
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", user?.id ?? "")
      .eq("status", "issued"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Account &amp; Subscriptions
        </h1>
        <p className="text-sm text-slate-500">
          Manage your active agreements, invoices, and service plans
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              Currently provisioned services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Pending Quotations
            </CardTitle>
            <FileText className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotationCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Offers awaiting your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Outstanding Invoices
            </CardTitle>
            <Receipt className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Due for payment
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
