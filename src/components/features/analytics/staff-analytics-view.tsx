"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  FileText,
  RefreshCw,
  TrendingUp,
  Receipt,
  ArrowRight,
  Package,
} from "lucide-react";
import type { StaffAnalyticsMetrics } from "@/lib/services/analytics";

interface StaffAnalyticsViewProps {
  metrics: StaffAnalyticsMetrics;
}

export function StaffAnalyticsView({ metrics }: StaffAnalyticsViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Staff Workspace &amp; Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Account assignments, open quotation pipeline, and invoice status strictly scoped to your accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/staff/catalogue">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              <span>Browse Catalogue</span>
            </Button>
          </Link>
          <Link href="/staff/customers">
            <Button size="sm" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>Assigned Customers</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Assigned Customers
            </CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.assignedCustomerCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active assigned accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Subscriptions
            </CardTitle>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.assignedActiveSubscriptionsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Provisioned recurring services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Open Quotations
            </CardTitle>
            <FileText className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.assignedOpenQuotationsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Drafts or awaiting client review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Revenue Collected
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.assignedCollectedRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Paid across your assigned accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action / Information Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/staff/customers" className="group">
          <Card className="h-full group-hover:border-blue-300 dark:group-hover:border-blue-700 transition">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Manage Assigned Customers
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  View contact records, review commercial history and adjust client details
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/staff/catalogue" className="group">
          <Card className="h-full group-hover:border-blue-300 dark:group-hover:border-blue-700 transition">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Product &amp; Plan Catalogue
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Browse valid sellable plans and check verified server pricing terms
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

