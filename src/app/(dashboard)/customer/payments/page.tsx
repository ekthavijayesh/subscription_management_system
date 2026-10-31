import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { listPayments } from "@/lib/services/payment.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CustomerPaymentsPage() {
  const session = await requireRole(["customer", "staff", "admin"]);

  // RLS scopes payments to customer_id = session.user.id
  const { payments, total } = await listPayments({
    customerId: session.user.id,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Receipts</h1>
          <p className="text-muted-foreground">
            Track your settlement history, paid receipts, and payment methods.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Receipts ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No payments recorded for your account.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Receipt / Payment #</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date (UTC)</th>
                    <th className="px-4 py-3 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{p.payment_number}</td>
                      <td className="px-4 py-3 capitalize">
                        {p.payment_method.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            p.status === "completed"
                              ? "default"
                              : p.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {p.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">
                        {p.currency} {p.amount}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/customer/invoices/${p.invoice_id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View Invoice
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
