import { describe, it, expect } from "vitest";
import {
  validateInvoiceTransition,
  assertInvoiceMutable,
  InvoiceStateError,
} from "@/lib/services/invoice-state.service";

describe("Invoice Immutability & Status Machine (TASK-046)", () => {
  it("allows issuing draft invoices", () => {
    const res = validateInvoiceTransition({
      currentStatus: "draft",
      action: "issue",
      userRole: "staff",
    });
    expect(res.nextStatus).toBe("issued");
  });

  it("allows marking issued or overdue invoice as paid", () => {
    const res1 = validateInvoiceTransition({
      currentStatus: "issued",
      action: "mark_paid",
      userRole: "staff",
    });
    expect(res1.nextStatus).toBe("paid");

    const res2 = validateInvoiceTransition({
      currentStatus: "overdue",
      action: "mark_paid",
      userRole: "admin",
    });
    expect(res2.nextStatus).toBe("paid");
  });

  it("blocks customer from transitioning invoices", () => {
    expect(() =>
      validateInvoiceTransition({
        currentStatus: "issued",
        action: "mark_paid",
        userRole: "customer",
      })
    ).toThrowError(InvoiceStateError);
  });

  it("prevents changing terminal states (paid -> issued/void/cancelled)", () => {
    expect(() =>
      validateInvoiceTransition({
        currentStatus: "paid",
        action: "cancel",
        userRole: "admin",
      })
    ).toThrowError(/Cannot transition invoice/);

    expect(() =>
      validateInvoiceTransition({
        currentStatus: "cancelled",
        action: "mark_paid",
        userRole: "staff",
      })
    ).toThrowError(/Cannot transition invoice/);
  });

  it("assertInvoiceMutable enforces document immutability for non-drafts", () => {
    expect(() => assertInvoiceMutable("draft")).not.toThrow();
    expect(() => assertInvoiceMutable("issued")).toThrowError(/strictly immutable/);
    expect(() => assertInvoiceMutable("paid")).toThrowError(/strictly immutable/);
    expect(() => assertInvoiceMutable("overdue")).toThrowError(/strictly immutable/);
  });
});
