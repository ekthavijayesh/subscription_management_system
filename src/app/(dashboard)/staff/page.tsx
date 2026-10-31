import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, RefreshCw } from "lucide-react";

export default async function StaffDashboardPage() {
  const supabase = createClient();

  const [{ count: assignedCount }, { count: quoteCount }] = await Promise.all([
    supabase
      .from("customer_staff_assignments")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("quotations")
      .select("*", { count: "exact", head: true })
      .in("status", ["draft", "sent"]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Staff Workspace
        </h1>
        <p className="text-sm text-slate-500">
          Commercial operations for your assigned accounts
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Assigned Customers
            </CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active assigned accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Open Quotations
            </CardTitle>
            <FileText className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quoteCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Draft or sent for acceptance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Operations Status
            </CardTitle>
            <RefreshCw className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Active</div>
            <p className="text-xs text-muted-foreground mt-1">
              RLS policy enforced
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
