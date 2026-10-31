import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { listQuotations } from "@/lib/services/quotation.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StaffQuotationsPage() {
  await requireRole(["staff", "admin"]);

  const { quotations, total } = await listQuotations({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground">
            Manage quotations, prepare drafts, and track customer proposals.
          </p>
        </div>
        <Link href="/staff/quotations/new">
          <Button>Create Quotation</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quotations ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {quotations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No quotations found. Create your first quotation to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Valid Until</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{q.quotation_number}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {q.customer_id}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={q.status === "draft" ? "secondary" : "default"}>
                          {q.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {q.currency} {q.total}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(q.valid_until).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {q.status === "draft" && (
                          <Link href={`/staff/quotations/${q.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                        )}
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
