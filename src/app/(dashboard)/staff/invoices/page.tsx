import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { listInvoices } from "@/lib/services/invoicing.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function StaffInvoicesPage() {
  await requireRole(["staff", "admin"]);
  const { invoices, total } = await listInvoices({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Monitor generated billing invoices, payment statuses, and issued totals.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No invoices generated yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {inv.customer_id}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            inv.status === "paid"
                              ? "default"
                              : inv.status === "overdue"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {inv.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(inv.billing_period_start).toLocaleDateString()} -{" "}
                        {new Date(inv.billing_period_end).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {inv.currency} {inv.total}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {inv.currency} {inv.amount_due}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/staff/invoices/${inv.id}`}>
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
