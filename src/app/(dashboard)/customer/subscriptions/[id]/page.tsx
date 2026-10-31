import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { getSubscriptionById } from "@/lib/services/subscription.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerCancellationForm } from "@/components/subscriptions/customer-cancellation-form";

interface Props {
  params: {
    id: string;
  };
}

export default async function CustomerSubscriptionDetailPage({ params }: Props) {
  const session = await requireRole(["customer", "staff", "admin"]);
  const subscription = await getSubscriptionById(params.id);

  if (!subscription) {
    notFound();
  }

  // Double check ownership in case non-admin/staff
  if (
    session.profile.role === "customer" &&
    subscription.customer_id !== session.user.id
  ) {
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
            Current Billing Period: {new Date(subscription.current_period_start).toLocaleDateString()} to{" "}
            {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomerCancellationForm
            subscriptionId={subscription.id}
            isCancelledOrPending={
              subscription.status === "cancelled" || subscription.cancel_at_period_end
            }
          />
          <Link href="/customer/subscriptions">
            <Button variant="outline">Back to My Subscriptions</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            <CardTitle className="text-sm font-medium">Renewal Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {subscription.auto_renew
              ? "Renews automatically at period end"
              : "Cancels at period end"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Unit Price</th>
                <th className="px-4 py-2">Discounts</th>
                <th className="px-4 py-2">Tax</th>
                <th className="px-4 py-2 text-right">Total</th>
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
    </div>
  );
}
