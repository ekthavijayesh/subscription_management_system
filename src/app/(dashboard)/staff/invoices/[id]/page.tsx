import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { getInvoiceById } from "@/lib/services/invoicing.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordPaymentModal } from "@/components/invoices/record-payment-modal";

interface Props {
  params: {
    id: string;
  };
}

export default async function StaffInvoiceDetailPage({ params }: Props) {
  await requireRole(["staff", "admin"]);
  const invoice = await getInvoiceById(params.id);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{invoice.invoice_number}</h1>
            <Badge
              variant={
                invoice.status === "paid"
                  ? "default"
                  : invoice.status === "overdue"
                  ? "destructive"
                  : "secondary"
              }
            >
              {invoice.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Issued: {new Date(invoice.issued_at).toLocaleDateString()} | Due:{" "}
            {new Date(invoice.due_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RecordPaymentModal
            invoiceId={invoice.id}
            currency={invoice.currency}
            amountDue={invoice.amount_due}
          />
          <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">Export / Print PDF</Button>
          </a>
          <Link href="/staff/invoices">
            <Button variant="outline" size="sm">Back to Invoices</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono">{invoice.customer_id}</CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Billing Period (UTC)</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {new Date(invoice.billing_period_start).toLocaleDateString()} to{" "}
            {new Date(invoice.billing_period_end).toLocaleDateString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            Paid: {invoice.currency} {invoice.amount_paid} / Due: {invoice.currency}{" "}
            {invoice.amount_due}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Line Items (Immutable Snapshot)</CardTitle>
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
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">
                    {invoice.currency} {item.unit_price}
                  </td>
                  <td className="px-4 py-3">
                    {invoice.currency} {item.discount_amount}
                  </td>
                  <td className="px-4 py-3">
                    {invoice.currency} {item.tax_amount}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {invoice.currency} {item.line_total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 border-t pt-4 space-y-1 text-sm text-right">
            <div>Subtotal: {invoice.currency} {invoice.subtotal}</div>
            <div>Discounts: -{invoice.currency} {invoice.discount_total}</div>
            <div>Tax: +{invoice.currency} {invoice.tax_total}</div>
            <div className="text-lg font-bold">
              Total Amount: {invoice.currency} {invoice.total}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
