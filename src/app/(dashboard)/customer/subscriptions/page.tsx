import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { listSubscriptions } from "@/lib/services/subscription.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CustomerSubscriptionsPage() {
  const session = await requireRole(["customer", "staff", "admin"]);

  // RLS will automatically restrict this to the customer's own subscriptions
  const { subscriptions, total } = await listSubscriptions({
    customerId: session.user.id,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Subscriptions</h1>
          <p className="text-muted-foreground">
            View your active plans, recurring invoices, and subscription terms.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active & Past Subscriptions ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              You do not have any active subscriptions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Subscription</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Cadence</th>
                    <th className="px-4 py-3">Next Renewal Date</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{s.subscription_number}</td>
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
                        Every {s.interval_count} {s.billing_interval}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.current_period_end).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {s.currency} {s.total}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/customer/subscriptions/${s.id}`}>
                          <Button variant="outline" size="sm">
                            Details
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
