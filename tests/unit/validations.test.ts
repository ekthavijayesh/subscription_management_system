import { describe, it, expect } from "vitest";
import {
  customerCreateSchema,
  customerUpdateSchema,
  customerSelfUpdateSchema,
} from "@/lib/validations/customer";
import { staffInviteSchema, staffUpdateSchema } from "@/lib/validations/staff";
import {
  productCreateSchema,
  productUpdateSchema,
  variantCreateSchema,
  variantUpdateSchema,
} from "@/lib/validations/product";
import { planCreateSchema, planUpdateSchema } from "@/lib/validations/plan";
import { assignmentCreateSchema, assignmentToggleSchema } from "@/lib/validations/assignment";

describe("Customer Validations", () => {
  it("validates valid customer create payload", () => {
    const valid = {
      email: "client@example.com",
      fullName: "Jane Client",
      companyName: "Acme",
      phone: "+1234567890",
      billingAddress: { city: "New York", country: "USA" },
    };
    const res = customerCreateSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("rejects invalid customer email", () => {
    const invalid = {
      email: "not-an-email",
      fullName: "Jane Client",
    };
    const res = customerCreateSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("enforces self-update field restrictions", () => {
    const selfPayload = {
      fullName: "Jane Updated",
      phone: "+1987654321",
      companyName: "Acme Corp",
      billingAddress: { city: "San Francisco" },
    };
    const res = customerSelfUpdateSchema.safeParse(selfPayload);
    expect(res.success).toBe(true);

    // Ensure role or email are stripped / not accepted
    const withForbidden = {
      ...selfPayload,
      role: "admin",
      email: "hacked@example.com",
    };
    const parsed = customerSelfUpdateSchema.parse(withForbidden);
    expect((parsed as any).role).toBeUndefined();
    expect((parsed as any).email).toBeUndefined();
  });
});

describe("Staff Validations", () => {
  it("validates staff invite payload", () => {
    const valid = {
      email: "staff@company.com",
      fullName: "Staff Member",
      role: "staff",
    };
    expect(staffInviteSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid role for staff invite", () => {
    const invalid = {
      email: "staff@company.com",
      fullName: "Staff Member",
      role: "customer", // Only staff or admin allowed
    };
    expect(staffInviteSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("Product and Variant Validations", () => {
  it("validates product creation with SKU", () => {
    const valid = {
      name: "Cloud Platform",
      sku: "PROD-CLOUD-1",
      description: "Cloud compute tier",
      isActive: true,
    };
    expect(productCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects product without SKU", () => {
    const invalid = {
      name: "Cloud Platform",
      sku: "",
    };
    expect(productCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it("validates variant creation under product", () => {
    const valid = {
      productId: "11111111-1111-4111-8111-111111111111",
      name: "High Memory",
      sku: "PROD-CLOUD-HM",
      attributes: { ram: "64GB" },
      isActive: true,
    };
    expect(variantCreateSchema.safeParse(valid).success).toBe(true);
  });
});

describe("Plan Validations", () => {
  it("validates plan with allowed billing intervals and positive price", () => {
    const valid = {
      productId: "11111111-1111-4111-8111-111111111111",
      name: "Annual Business",
      billingInterval: "year",
      intervalCount: 1,
      price: 1200.0,
      currency: "USD",
      isActive: true,
    };
    expect(planCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects negative price and zero interval count", () => {
    const invalidPrice = {
      productId: "11111111-1111-4111-8111-111111111111",
      name: "Bad Plan",
      billingInterval: "month",
      intervalCount: 1,
      price: -50.0,
    };
    expect(planCreateSchema.safeParse(invalidPrice).success).toBe(false);

    const invalidInterval = {
      productId: "11111111-1111-4111-8111-111111111111",
      name: "Bad Plan",
      billingInterval: "month",
      intervalCount: 0,
      price: 50.0,
    };
    expect(planCreateSchema.safeParse(invalidInterval).success).toBe(false);
  });
});

describe("Assignment Validations", () => {
  it("validates staff-to-customer assignment UUIDs", () => {
    const valid = {
      customerId: "11111111-1111-4111-8111-111111111111",
      staffId: "22222222-2222-4222-8222-222222222222",
      permissions: ["read", "write"],
    };
    expect(assignmentCreateSchema.safeParse(valid).success).toBe(true);
  });
});

