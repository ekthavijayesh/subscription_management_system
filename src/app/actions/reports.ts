"use server";

import { requireRole } from "@/lib/auth/authorization";
import { generateExportReport, type ReportType } from "@/lib/services/reports";

export interface ReportActionState {
  success: boolean;
  error?: string;
  data?: {
    csvContent: string;
    filename: string;
    rowCount: number;
  };
}

export async function exportReportAction(formData: FormData): Promise<ReportActionState> {
  try {
    const session = await requireRole(["admin", "staff"]);

    const reportType = formData.get("reportType") as ReportType;
    const startDate = (formData.get("startDate") as string) || undefined;
    const endDate = (formData.get("endDate") as string) || undefined;

    if (!["revenue", "subscriptions", "customers", "invoices"].includes(reportType)) {
      return { success: false, error: "Invalid report type selected" };
    }

    const report = await generateExportReport(
      {
        type: reportType,
        startDate,
        endDate,
      },
      session.profile.id
    );

    const filename = `${reportType}-report-${new Date().toISOString().split("T")[0]}.csv`;

    return {
      success: true,
      data: {
        csvContent: report.csvContent,
        filename,
        rowCount: report.rowCount,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to generate report export" };
  }
}

