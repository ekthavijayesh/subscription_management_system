import { requireRole } from "@/lib/auth/authorization";
import { QuotationForm } from "@/components/quotations/quotation-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewQuotationPage() {
  await requireRole(["staff", "admin"]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Quotation</h1>
          <p className="text-muted-foreground">
            Issue a new quotation draft for an active customer.
          </p>
        </div>
        <Link href="/staff/quotations">
          <Button variant="outline">Back to Quotations</Button>
        </Link>
      </div>

      <QuotationForm mode="create" />
    </div>
  );
}
