import Link from "next/link";
import { ArrowRight, ShieldCheck, CreditCard, RefreshCw, BarChart3, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            <span>SubSys</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Access Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-6">
          <ShieldCheck className="w-4 h-4" />
          Production-Grade SaaS Subscription &amp; Billing
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl">
          Unified Subscription, Invoicing &amp; Customer Lifecycle Platform
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
          Manage catalogues, plans, customized quotations, automated recurring billing,
          immutable invoices, payments, and multi-role operations with auditable precision.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm transition"
          >
            Launch System
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-left w-full">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Role-Based Access</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Admin, staff, and customer boundaries strictly guarded by Row-Level Security and server authorization.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Billing &amp; Invoicing</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Idempotent period invoicing, tamper-proof snapshots, discounts, taxes, and auditable payment allocations.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Auditing &amp; Analytics</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Append-only event timelines, comprehensive actor activity trails, and real-time operational metrics.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          &copy; 2026 Subscription Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
