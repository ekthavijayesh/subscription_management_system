import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { getQuotationById } from "@/lib/services/quotation.service";
import { QuotationForm } from "@/components/quotations/quotation-form";
import { Button } from "@/components/ui/button";

interface Props {
  params: {
    id: string;
  };
}

export default async function EditQuotationPage({ params }: Props) {
  await requireRole(["staff", "admin"]);

  const quotation = await getQuotationById(params.id);
  if (!quotation) {
    notFound();
  }

  if (quotation.status !== "draft") {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Quotation is Not Editable</h1>
        <p className="text-muted-foreground">
          Quotation {quotation.quotation_number} has status &quot;{quotation.status}&quot;. Only draft quotations can be modified.
        </p>
        <div>
          <Link href="/staff/quotations">
            <Button variant="outline">Back to Quotations</Button>
          </Link>
        </div>
      </div>
    );
  }

  const defaultValues = {
    customer_id: quotation.customer_id,
    valid_until: quotation.valid_until,
    currency: quotation.currency,
    notes: quotation.notes ?? "",
    items: quotation.items.map((item) => ({
      plan_id: item.plan_id ?? "",
      description: item.description,
      quantity: item.quantity,
      discount_code: "",
    })),
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Quotation Draft</h1>
          <p className="text-muted-foreground">
            Editing {quotation.quotation_number}
          </p>
        </div>
        <Link href="/staff/quotations">
          <Button variant="outline">Back to Quotations</Button>
        </Link>
      </div>

      <QuotationForm
        mode="edit"
        quotationId={quotation.id}
        defaultValues={defaultValues}
      />
    </div>
  );
}
