"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  LogOut,
  LayoutDashboard,
  Users,
  Package,
  Layers,
  FileText,
  CreditCard,
  Receipt,
  Settings,
  Bell,
  Menu,
  X,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import type { UserRole } from "@/types/database.types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  role: UserRole;
  userEmail: string;
  userName?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  userEmail,
  userName,
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile menu upon navigation
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const adminNav: NavItem[] = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Staff", href: "/admin/staff", icon: Users },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Plans", href: "/admin/plans", icon: Layers },
    { label: "Quotations", href: "/admin/quotations", icon: FileText },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: RefreshCw },
    { label: "Invoices", href: "/admin/invoices", icon: Receipt },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  ];

  const staffNav: NavItem[] = [
    { label: "Overview", href: "/staff", icon: LayoutDashboard },
    { label: "Assigned Customers", href: "/staff/customers", icon: Users },
    { label: "Catalogue", href: "/staff/catalogue", icon: Package },
    { label: "Quotations", href: "/staff/quotations", icon: FileText },
    { label: "Subscriptions", href: "/staff/subscriptions", icon: RefreshCw },
    { label: "Invoices", href: "/staff/invoices", icon: Receipt },
  ];

  const customerNav: NavItem[] = [
    { label: "Overview", href: "/customer", icon: LayoutDashboard },
    { label: "Catalogue", href: "/customer/catalogue", icon: Package },
    { label: "My Subscriptions", href: "/customer/subscriptions", icon: RefreshCw },
    { label: "Quotations", href: "/customer/quotations", icon: FileText },
    { label: "Invoices & Receipts", href: "/customer/invoices", icon: Receipt },
    { label: "Account Settings", href: "/customer/settings", icon: Settings },
  ];

  const navItems =
    role === "admin" ? adminNav : role === "staff" ? staffNav : customerNav;

  // Breadcrumb generator
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    return {
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      href,
      isLast: index === pathSegments.length - 1,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30">
        <Link href={`/${role}`} className="flex items-center gap-2 font-bold text-lg text-primary">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          <span>SubSys</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize text-xs font-semibold">
            {role}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar - Desktop and Mobile Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Logo / Header (Desktop) */}
          <div className="hidden md:flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
            <Link href={`/${role}`} className="flex items-center gap-2 font-bold text-lg text-primary">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <span>SubSys</span>
            </Link>
            <Badge variant="outline" className="capitalize text-xs font-semibold">
              {role}
            </Badge>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Main Navigation" className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === `/${role}`
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center font-bold text-xs text-blue-700 dark:text-blue-300 uppercase">
              {(userName || userEmail).charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {userName || "User"}
              </p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign out</span>
            </Button>
          </form>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-slate-500">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                {crumb.isLast ? (
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {crumb.name}
                  </span>
                ) : (
                  <Link href={crumb.href} className="hover:text-slate-800 dark:hover:text-slate-200">
                    {crumb.name}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full" />
            </Button>
          </div>
        </header>

        <main className="p-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
