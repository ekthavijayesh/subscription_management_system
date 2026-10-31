import { describe, it, expect, beforeEach } from "vitest";
import { formatCurrency } from "@/lib/utils";

describe("Utils - formatCurrency", () => {
  it("formats positive numeric amounts accurately", () => {
    expect(formatCurrency(1234.56, "USD", "en-US")).toBe("$1,234.56");
  });

  it("formats zero amount accurately", () => {
    expect(formatCurrency(0, "USD", "en-US")).toBe("$0.00");
  });

  it("handles string decimal numbers safely", () => {
    expect(formatCurrency("99.99", "USD", "en-US")).toBe("$99.99");
  });
});
