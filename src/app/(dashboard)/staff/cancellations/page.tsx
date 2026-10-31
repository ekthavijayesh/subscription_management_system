import { requireRole } from "@/lib/auth/authorization";
import { listCancellationRequests } from "@/lib/services/cancellation.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CancellationDecisionButtons } from "@/components/subscriptions/cancellation-decision-buttons";

export default async function StaffCancellationsPage() {
  await requireRole(["staff", "admin"]);
  const requests = await listCancellationRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cancellation Requests</h1>
        <p className="text-muted-foreground">
          Review, approve, or reject customer-initiated subscription cancellations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No cancellation requests submitted.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Subscription</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Date (UTC)</th>
                    <th className="px-4 py-3 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs">{req.subscription_id}</td>
                      <td className="px-4 py-3 font-mono text-xs">{req.customer_id}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            req.status === "approved"
                              ? "default"
                              : req.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {req.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">{req.reason}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {req.status === "pending" ? (
                          <CancellationDecisionButtons requestId={req.id} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {req.decision_notes ? `Notes: ${req.decision_notes}` : "Decided"}
                          </span>
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
