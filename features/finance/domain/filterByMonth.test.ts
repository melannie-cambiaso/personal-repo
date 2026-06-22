import { describe, it, expect } from "vitest";
import { filterByMonth } from "./filterByMonth";
import type { FinanceEntry } from "./FinanceEntry";

const make = (date: string): FinanceEntry => ({
  id: crypto.randomUUID(), type: "expense", group: "Gastos fijos",
  category: "Comida", amount: 100, date, createdAt: new Date().toISOString(),
});

describe("filterByMonth", () => {
  it("returns empty for empty input", () => {
    expect(filterByMonth([], "2026-06")).toEqual([]);
  });

  it("returns only entries matching the month prefix", () => {
    const entries = [make("2026-06-01"), make("2026-06-30"), make("2026-07-01")];
    expect(filterByMonth(entries, "2026-06")).toHaveLength(2);
  });

  it("excludes adjacent months", () => {
    const entries = [make("2026-05-31"), make("2026-06-01"), make("2026-07-01")];
    const result = filterByMonth(entries, "2026-06");
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-06-01");
  });

  it("handles year boundary", () => {
    const entries = [make("2025-12-31"), make("2026-01-01")];
    expect(filterByMonth(entries, "2026-01")).toHaveLength(1);
  });
});
