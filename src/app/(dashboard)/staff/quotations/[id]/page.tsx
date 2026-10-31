import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/authorization";
import { getQuotationById } from "@/lib/services/quotation.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuotationActionsBar } from "@/components/quotations/quotation-actions-bar";

interface Props {
  params: {
    id: string;
  };
}

export default async function QuotationDetailPage({ params }: Props) {
  const session = await requireAuth();
  const quotation = await getQuotationById(params.id);

  if (!quotation) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {quotation.quotation_number}
            </h1>
            <Badge variant={quotation.status === "draft" ? "secondary" : "default"}>
              {quotation.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Valid until {new Date(quotation.valid_until).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <QuotationActionsBar
            quotationId={quotation.id}
            status={quotation.status}
            userRole={session.profile.role as "admin" | "staff" | "customer"}
          />
          {quotation.status === "draft" &&
            (session.profile.role === "admin" || session.profile.role === "staff") && (
              <Link href={`/staff/quotations/${quotation.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono">
            {quotation.customer_id}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Created By</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono">
            {quotation.created_by}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items & Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Unit Price</th>
                <th className="px-4 py-2">Discount</th>
                <th className="px-4 py-2">Tax</th>
                <th className="px-4 py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotation.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">
                    {quotation.currency} {item.unit_price}
                  </td>
                  <td className="px-4 py-3">
                    {quotation.currency} {item.discount_amount}
                  </td>
                  <td className="px-4 py-3">
                    {quotation.currency} {item.tax_amount}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {quotation.currency} {item.line_total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 border-t pt-4 space-y-1 text-sm text-right">
            <div>Subtotal: {quotation.currency} {quotation.subtotal}</div>
            <div>Discounts: -{quotation.currency} {quotation.discount_total}</div>
            <div>Tax: +{quotation.currency} {quotation.tax_total}</div>
            <div className="text-lg font-bold">
              Total: {quotation.currency} {quotation.total}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
