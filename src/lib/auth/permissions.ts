import type { UserRole } from "@/types/database.types";

export const ROLES = {
  ADMIN: "admin" as const,
  STAFF: "staff" as const,
  CUSTOMER: "customer" as const,
};

export const PERMISSIONS = {
  // Products & Catalogue
  CATALOGUE_VIEW: ["admin", "staff", "customer"] as UserRole[],
  CATALOGUE_MANAGE: ["admin"] as UserRole[],

  // Plans
  PLANS_VIEW: ["admin", "staff", "customer"] as UserRole[],
  PLANS_MANAGE: ["admin"] as UserRole[],

  // Customers
  CUSTOMERS_VIEW_ALL: ["admin"] as UserRole[],
  CUSTOMERS_VIEW_ASSIGNED: ["staff"] as UserRole[],
  CUSTOMERS_MANAGE: ["admin", "staff"] as UserRole[],

  // Staff Administration
  STAFF_MANAGE: ["admin"] as UserRole[],

  // Quotations
  QUOTATIONS_VIEW_ALL: ["admin"] as UserRole[],
  QUOTATIONS_MANAGE: ["admin", "staff"] as UserRole[],

  // Subscriptions
  SUBSCRIPTIONS_VIEW_ALL: ["admin"] as UserRole[],
  SUBSCRIPTIONS_MANAGE: ["admin", "staff"] as UserRole[],

  // Invoices & Payments
  INVOICES_VIEW_ALL: ["admin"] as UserRole[],
  INVOICES_MANAGE: ["admin", "staff"] as UserRole[],
  PAYMENTS_RECORD: ["admin", "staff"] as UserRole[],

  // Discounts & Tax Rules
  DISCOUNTS_MANAGE: ["admin"] as UserRole[],
  TAX_RULES_MANAGE: ["admin"] as UserRole[],

  // Activity Logs & Observability
  AUDIT_LOGS_VIEW: ["admin"] as UserRole[],
};

export function canPerform(role: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role);
}
