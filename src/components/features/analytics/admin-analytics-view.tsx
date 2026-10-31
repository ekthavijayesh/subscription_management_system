"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  RefreshCw,
  Receipt,
  TrendingUp,
  AlertCircle,
  FileText,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { AdminAnalyticsMetrics } from "@/lib/services/analytics";

interface AdminAnalyticsViewProps {
  metrics: AdminAnalyticsMetrics;
}

export function AdminAnalyticsView({ metrics }: AdminAnalyticsViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Admin Overview &amp; Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Real-time financial summaries, recurring subscriptions, and client ledger activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/reports">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>Export Reports</span>
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button size="sm" className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              <span>Manage Catalogue</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Revenue Collected
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Verified completed payments
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Subscriptions
            </CardTitle>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.activeSubscriptionsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently generating recurring billing
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Customers
            </CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.totalCustomersCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered client profiles
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Overdue Invoices
            </CardTitle>
            <Receipt className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.overdueInvoicesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(metrics.overdueAmount)} pending collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Monthly Revenue & Subscription Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span>Monthly Payment Inflow</span>
            </CardTitle>
            <CardDescription>
              Aggregated payment transactions over recent months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.monthlyRevenue.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 italic border border-dashed rounded-md">
                No recorded payment cycles yet.
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.monthlyRevenue.map((item) => (
                  <div key={item.month} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      {item.month}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-blue-500" />
              <span>Subscription Portfolio Breakdown</span>
            </CardTitle>
            <CardDescription>
              Current distribution of recurring agreement states
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.subscriptionBreakdown.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 italic border border-dashed rounded-md">
                No subscription contracts created yet.
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.subscriptionBreakdown.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900/40 text-xs"
                  >
                    <StatusBadge status={item.status} />
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {item.count} agreements
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link href="/admin/customers" className="group">
          <Card className="h-full group-hover:border-blue-300 dark:group-hover:border-blue-700 transition">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  Customers &amp; Assignments
                </p>
                <p className="text-xs text-slate-500">
                  Assign staff and manage profiles
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/plans" className="group">
          <Card className="h-full group-hover:border-blue-300 dark:group-hover:border-blue-700 transition">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  Subscription Plans
                </p>
                <p className="text-xs text-slate-500">
                  Configure cadences and pricing
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/reports" className="group">
          <Card className="h-full group-hover:border-blue-300 dark:group-hover:border-blue-700 transition">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  Audit Reports &amp; Exports
                </p>
                <p className="text-xs text-slate-500">
                  Download time-zone consistent CSVs
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

