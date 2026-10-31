import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { getSubscriptionById } from "@/lib/services/subscription.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionActionsBar } from "@/components/subscriptions/subscription-actions-bar";

interface Props {
  params: {
    id: string;
  };
}

export default async function StaffSubscriptionDetailPage({ params }: Props) {
  await requireRole(["staff", "admin"]);
  const subscription = await getSubscriptionById(params.id);

  if (!subscription) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {subscription.subscription_number}
            </h1>
            <Badge
              variant={
                subscription.status === "active"
                  ? "default"
                  : subscription.status === "past_due"
                  ? "destructive"
                  : "secondary"
              }
            >
              {subscription.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Current Period: {new Date(subscription.current_period_start).toLocaleDateString()} to{" "}
            {new Date(subscription.current_period_end).toLocaleDateString()} (UTC)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SubscriptionActionsBar
            subscriptionId={subscription.id}
            status={subscription.status}
          />
          <Link href="/staff/subscriptions">
            <Button variant="outline">Back to Subscriptions</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono">{subscription.customer_id}</CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Cadence</CardTitle>
          </CardHeader>
          <CardContent className="text-sm capitalize">
            Every {subscription.interval_count} {subscription.billing_interval}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Auto Renew</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {subscription.auto_renew ? "Enabled" : "Disabled"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-2">Item Description</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Unit Price</th>
                <th className="px-4 py-2">Discount</th>
                <th className="px-4 py-2">Tax</th>
                <th className="px-4 py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscription.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">
                    {subscription.currency} {item.unit_price}
                  </td>
                  <td className="px-4 py-3">
                    {subscription.currency} {item.discount_amount}
                  </td>
                  <td className="px-4 py-3">
                    {subscription.currency} {item.tax_amount}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {subscription.currency} {item.line_total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 border-t pt-4 space-y-1 text-sm text-right">
            <div>Subtotal: {subscription.currency} {subscription.subtotal}</div>
            <div>Discounts: -{subscription.currency} {subscription.discount_total}</div>
            <div>Tax: +{subscription.currency} {subscription.tax_total}</div>
            <div className="text-lg font-bold">
              Total per Period: {subscription.currency} {subscription.total}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lifecycle & Audit Events</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lifecycle events recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {subscription.events.map((evt) => (
                <div key={evt.id} className="text-sm flex items-center justify-between border-b pb-2">
                  <div>
                    <span className="font-semibold capitalize">
                      {evt.event_type.replace(/_/g, " ")}
                    </span>
                    {evt.actor_id && (
                      <span className="text-muted-foreground text-xs ml-2 font-mono">
                        (Actor: {evt.actor_id})
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(evt.occurred_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
