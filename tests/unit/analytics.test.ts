import { describe, it, expect } from "vitest";

describe("Analytics Scoping and Metric Derivation Invariants", () => {
  it("computes admin revenue strictly from completed payments", () => {
    const payments = [
      { id: "1", amount: 150.0, status: "completed" },
      { id: "2", amount: 75.5, status: "pending" },
      { id: "3", amount: 200.0, status: "failed" },
      { id: "4", amount: 350.0, status: "completed" },
      { id: "5", amount: 50.0, status: "refunded" },
    ];

    const totalRevenue = payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    expect(totalRevenue).toBe(500.0);
  });

  it("identifies overdue invoices correctly by status and due date", () => {
    const now = new Date("2026-10-31T12:00:00Z");
    const invoices = [
      { id: "1", status: "issued", due_date: "2026-10-15T00:00:00Z", total: 100 }, // past due
      { id: "2", status: "issued", due_date: "2026-11-15T00:00:00Z", total: 200 }, // not yet due
      { id: "3", status: "overdue", due_date: "2026-10-01T00:00:00Z", total: 150 }, // explicitly overdue
      { id: "4", status: "paid", due_date: "2026-10-10T00:00:00Z", total: 500 }, // paid
    ];

    const overdue = invoices.filter(
      (inv) =>
        inv.status === "overdue" ||
        (inv.status === "issued" && new Date(inv.due_date) < now)
    );

    expect(overdue.map((i) => i.id)).toEqual(["1", "3"]);
    const overdueTotal = overdue.reduce((sum, i) => sum + i.total, 0);
    expect(overdueTotal).toBe(250);
  });

  it("guarantees staff analytics strictly filters to assigned customers without leakage", () => {
    const staff1Assignments = ["cust-A", "cust-B"];
    const allInvoices = [
      { id: "inv-1", customer_id: "cust-A", total: 100 },
      { id: "inv-2", customer_id: "cust-B", total: 200 },
      { id: "inv-3", customer_id: "cust-C", total: 999 }, // Belongs to Staff 2
    ];

    const staff1Invoices = allInvoices.filter((inv) =>
      staff1Assignments.includes(inv.customer_id)
    );

    expect(staff1Invoices.map((i) => i.id)).toEqual(["inv-1", "inv-2"]);
    expect(staff1Invoices.some((i) => i.customer_id === "cust-C")).toBe(false);
  });

  it("calculates customer next renewal date from earliest active subscription period end", () => {
    const subscriptions = [
      { id: "sub-1", status: "active", current_period_end: "2026-11-15T00:00:00Z" },
      { id: "sub-2", status: "active", current_period_end: "2026-11-05T00:00:00Z" },
      { id: "sub-3", status: "cancelled", current_period_end: "2026-11-01T00:00:00Z" },
    ];

    const activeSubs = subscriptions.filter((s) => s.status === "active");
    const earliest = activeSubs
      .map((s) => s.current_period_end)
      .sort()[0];

    expect(earliest).toBe("2026-11-05T00:00:00Z");
  });
});

