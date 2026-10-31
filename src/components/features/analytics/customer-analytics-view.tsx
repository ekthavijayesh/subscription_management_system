"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  RefreshCw,
  Receipt,
  FileText,
  Calendar,
  CreditCard,
  Package,
  Settings,
  ArrowRight,
} from "lucide-react";
import type { CustomerAnalyticsMetrics } from "@/lib/services/analytics";

interface CustomerAnalyticsViewProps {
  metrics: CustomerAnalyticsMetrics;
  customerName: string;
}

export function CustomerAnalyticsView({
  metrics,
  customerName,
}: CustomerAnalyticsViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {customerName || "Customer"}
          </h1>
          <p className="text-sm text-slate-500">
            Overview of your active SaaS subscriptions, upcoming renewals, and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/customer/catalogue">
            <Button size="sm" className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              <span>Explore Services</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Subscriptions
            </CardTitle>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscriptionsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active service agreements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Next Renewal
            </CardTitle>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {metrics.nextRenewalDate
                ? new Date(metrics.nextRenewalDate).toLocaleDateString()
                : "No active renewals"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.nextRenewalDate ? "Automated billing cycle" : "Browse plans to subscribe"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Pending Offers
            </CardTitle>
            <FileText className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingQuotationsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Quotations awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Payments
            </CardTitle>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.totalPaidAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Settled invoices &amp; receipts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/customer/catalogue" className="group">
          <Card className="h-full group-hover:border-blue-300 dark:group-hover:border-blue-700 transition">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Available Plans
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Discover new subscription services and plans
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/customer/invoices" className="group">
          <Card className="h-full group-hover:border-blue-300 dark:group-hover:border-blue-700 transition">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Invoices &amp; Receipts
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Download statement PDFs and review payment history
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/customer/settings" className="group">
          <Card className="h-full group-hover:border-blue-300 dark:group-hover:border-blue-700 transition">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Account Settings
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Update company info and default billing addresses
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

