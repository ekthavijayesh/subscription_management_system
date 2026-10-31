import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { listSubscriptions } from "@/lib/services/subscription.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function StaffSubscriptionsPage() {
  await requireRole(["staff", "admin"]);

  const { subscriptions, total } = await listSubscriptions({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Monitor and manage customer recurring contracts and billing periods.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active or existing subscriptions found. Convert approved quotations to begin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Interval</th>
                    <th className="px-4 py-3">Period End (UTC)</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{s.subscription_number}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {s.customer_id}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            s.status === "active"
                              ? "default"
                              : s.status === "past_due"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {s.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {s.interval_count} {s.billing_interval}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.current_period_end).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {s.currency} {s.total}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/staff/subscriptions/${s.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
