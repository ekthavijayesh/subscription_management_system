import { requireRole } from "@/lib/auth/authorization";
import { ReportGenerator } from "@/components/features/reports/report-generator";

export default async function AdminReportsPage() {
  await requireRole(["admin", "staff"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reports &amp; Data Exports
        </h1>
        <p className="text-sm text-slate-500">
          Generate structured, audited CSV summaries for financial compliance, revenue forecasting, and subscriptions.
        </p>
      </div>

      <ReportGenerator />
    </div>
  );
}

