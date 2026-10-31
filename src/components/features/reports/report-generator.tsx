"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { exportReportAction } from "@/app/actions/reports";
import { useToast } from "@/components/ui/use-toast";
import { Download, FileText, CheckCircle2 } from "lucide-react";

export function ReportGenerator() {
  const { toast } = useToast();
  const [reportType, setReportType] = React.useState<string>("revenue");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [lastExport, setLastExport] = React.useState<{ filename: string; count: number } | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("reportType", reportType);
    if (startDate) formData.append("startDate", startDate);
    if (endDate) formData.append("endDate", endDate);

    const res = await exportReportAction(formData);
    setLoading(false);

    if (!res.success || !res.data) {
      toast({
        title: "Export Failed",
        description: res.error || "Failed to generate report export.",
        variant: "destructive",
      });
      return;
    }

    // Trigger browser download via Blob
    const blob = new Blob([res.data.csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", res.data.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setLastExport({ filename: res.data.filename, count: res.data.rowCount });
    toast({
      title: "Export Completed",
      description: `Downloaded ${res.data.rowCount} records as ${res.data.filename}`,
    });
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span>Export Commercial &amp; Operational Reports</span>
        </CardTitle>
        <CardDescription>
          Generate authorized, time-zone consistent CSV exports for financial and organizational auditing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleExport} className="space-y-4">
          <FormField label="Report Domain" required>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue &amp; Payment Ledger</SelectItem>
                <SelectItem value="subscriptions">Subscriptions &amp; Renewals</SelectItem>
                <SelectItem value="customers">Customer Directory &amp; Accounts</SelectItem>
                <SelectItem value="invoices">Invoices &amp; Balances</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Start Date (Optional)">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormField>

            <FormField label="End Date (Optional)">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormField>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>{loading ? "Generating CSV..." : "Export to CSV"}</span>
            </Button>

            {lastExport && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Exported {lastExport.count} records</span>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

