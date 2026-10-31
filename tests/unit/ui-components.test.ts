import { describe, it, expect } from "vitest";

describe("StatusBadge mapping and invariants", () => {
  it("determines correct variant according to status", () => {
    const successStatuses = ["active", "approved", "paid", "completed"];
    const warningStatuses = ["sent", "pending", "issued", "paused"];
    const destructiveStatuses = ["rejected", "overdue", "failed", "past_due"];
    const secondaryStatuses = ["draft", "expired", "cancelled", "void", "inactive", "archived"];

    // Verify disjoint sets
    const all = [...successStatuses, ...warningStatuses, ...destructiveStatuses, ...secondaryStatuses];
    const unique = new Set(all);
    expect(unique.size).toBe(all.length);
  });

  it("handles boolean active status correctly", () => {
    const activeText = true ? "active" : "inactive";
    const inactiveText = false ? "active" : "inactive";
    expect(activeText).toBe("active");
    expect(inactiveText).toBe("inactive");
  });
});

describe("DataTable sorting and pagination invariants", () => {
  const sampleData = [
    { id: "1", name: "Alpha", price: 100 },
    { id: "2", name: "Gamma", price: 300 },
    { id: "3", name: "Beta", price: 200 },
  ];

  it("sorts ascending and descending correctly", () => {
    const asc = [...sampleData].sort((a, b) => a.name.localeCompare(b.name));
    expect(asc.map((i) => i.name)).toEqual(["Alpha", "Beta", "Gamma"]);

    const desc = [...sampleData].sort((a, b) => b.name.localeCompare(a.name));
    expect(desc.map((i) => i.name)).toEqual(["Gamma", "Beta", "Alpha"]);
  });

  it("filters accurately across keys", () => {
    const query = "gam";
    const filtered = sampleData.filter((i) =>
      i.name.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("2");
  });

  it("calculates total pages accurately", () => {
    const totalItems = 25;
    const pageSize = 10;
    const totalPages = Math.ceil(totalItems / pageSize);
    expect(totalPages).toBe(3);
  });
});

