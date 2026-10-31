import { describe, it, expect } from "vitest";
import { getClientEnv, getServerEnv } from "@/lib/env";
import { canPerform, PERMISSIONS, ROLES } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

describe("Production Smoke Test Suite (TASK-065)", () => {
  it("validates client environment variables against configured Supabase project", () => {
    const clientEnv = getClientEnv();
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
    expect(clientEnv.NEXT_PUBLIC_APP_URL).toBeDefined();
  });

  it("validates server-only environment variables and secret role key", () => {
    const serverEnv = getServerEnv();
    expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
    expect(serverEnv.CRON_SECRET).toBeDefined();
  });

  it("initializes administrative Supabase client with service role key", () => {
    const admin = createAdminClient();
    expect(admin).toBeDefined();
    expect(admin.auth).toBeDefined();
    expect(admin.from).toBeDefined();
  });

  it("enforces complete role permission boundary", () => {
    // Admin permissions
    expect(canPerform(ROLES.ADMIN, PERMISSIONS.CATALOGUE_MANAGE)).toBe(true);
    expect(canPerform(ROLES.ADMIN, PERMISSIONS.PLANS_MANAGE)).toBe(true);
    expect(canPerform(ROLES.ADMIN, PERMISSIONS.STAFF_MANAGE)).toBe(true);
    expect(canPerform(ROLES.ADMIN, PERMISSIONS.DISCOUNTS_MANAGE)).toBe(true);
    expect(canPerform(ROLES.ADMIN, PERMISSIONS.TAX_RULES_MANAGE)).toBe(true);
    expect(canPerform(ROLES.ADMIN, PERMISSIONS.AUDIT_LOGS_VIEW)).toBe(true);

    // Staff permissions
    expect(canPerform(ROLES.STAFF, PERMISSIONS.QUOTATIONS_MANAGE)).toBe(true);
    expect(canPerform(ROLES.STAFF, PERMISSIONS.INVOICES_MANAGE)).toBe(true);
    expect(canPerform(ROLES.STAFF, PERMISSIONS.PAYMENTS_RECORD)).toBe(true);
    expect(canPerform(ROLES.STAFF, PERMISSIONS.CUSTOMERS_MANAGE)).toBe(true);

    // Staff restricted
    expect(canPerform(ROLES.STAFF, PERMISSIONS.STAFF_MANAGE)).toBe(false);
    expect(canPerform(ROLES.STAFF, PERMISSIONS.PLANS_MANAGE)).toBe(false);
    expect(canPerform(ROLES.STAFF, PERMISSIONS.DISCOUNTS_MANAGE)).toBe(false);
    expect(canPerform(ROLES.STAFF, PERMISSIONS.AUDIT_LOGS_VIEW)).toBe(false);

    // Customer restricted
    expect(canPerform(ROLES.CUSTOMER, PERMISSIONS.CATALOGUE_MANAGE)).toBe(false);
    expect(canPerform(ROLES.CUSTOMER, PERMISSIONS.PLANS_MANAGE)).toBe(false);
    expect(canPerform(ROLES.CUSTOMER, PERMISSIONS.CUSTOMERS_MANAGE)).toBe(false);
    expect(canPerform(ROLES.CUSTOMER, PERMISSIONS.INVOICES_MANAGE)).toBe(false);
    expect(canPerform(ROLES.CUSTOMER, PERMISSIONS.PAYMENTS_RECORD)).toBe(false);
  });
});
