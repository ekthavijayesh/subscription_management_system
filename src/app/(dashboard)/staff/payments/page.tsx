import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { listPayments } from "@/lib/services/payment.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function StaffPaymentsPage() {
  await requireRole(["staff", "admin"]);
  const { payments, total } = await listPayments({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Receipts</h1>
          <p className="text-muted-foreground">
            Complete transaction history, settlement methods, and allocation records.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recorded Transactions ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No payments recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Payment #</th>
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Invoice ID</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{p.payment_number}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {p.customer_id}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        <Link href={`/staff/invoices/${p.invoice_id}`} className="hover:underline">
                          {p.invoice_id}
                        </Link>
                      </td>
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
                      <td className="px-4 py-3 font-medium text-emerald-600">
                        {p.currency} {p.amount}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(p.created_at).toLocaleString()}
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
