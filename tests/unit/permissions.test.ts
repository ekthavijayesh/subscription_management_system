import { describe, it, expect } from "vitest";
import { canPerform, PERMISSIONS } from "@/lib/auth/permissions";

describe("Permissions", () => {
  it("allows admin to manage catalogue", () => {
    expect(canPerform("admin", PERMISSIONS.CATALOGUE_MANAGE)).toBe(true);
  });

  it("denies customer from managing catalogue", () => {
    expect(canPerform("customer", PERMISSIONS.CATALOGUE_MANAGE)).toBe(false);
  });

  it("denies staff from managing plans", () => {
    expect(canPerform("staff", PERMISSIONS.PLANS_MANAGE)).toBe(false);
  });

  it("allows staff and admin to manage quotations", () => {
    expect(canPerform("admin", PERMISSIONS.QUOTATIONS_MANAGE)).toBe(true);
    expect(canPerform("staff", PERMISSIONS.QUOTATIONS_MANAGE)).toBe(true);
    expect(canPerform("customer", PERMISSIONS.QUOTATIONS_MANAGE)).toBe(false);
  });
});
