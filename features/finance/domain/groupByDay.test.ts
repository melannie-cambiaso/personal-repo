import { describe, it, expect } from "vitest";
import { groupByDay } from "./groupByDay";
import type { FinanceEntry } from "./FinanceEntry";

const make = (date: string, createdAt = "2026-06-01T10:00:00Z"): FinanceEntry => ({
  id: crypto.randomUUID(), type: "expense", group: "Gastos fijos",
  category: "Comida", amount: 100, date, createdAt,
});

describe("groupByDay", () => {
  it("returns empty map for empty input", () => {
    expect(groupByDay([])).toEqual(new Map());
  });

  it("groups entries by date key", () => {
    const entries = [make("2026-06-15"), make("2026-06-10"), make("2026-06-15")];
    const result = groupByDay(entries);
    expect(result.get("2026-06-15")).toHaveLength(2);
    expect(result.get("2026-06-10")).toHaveLength(1);
  });

  it("keys are sorted descending", () => {
    const entries = [make("2026-06-10"), make("2026-06-20"), make("2026-06-15")];
    const keys = [...groupByDay(entries).keys()];
    expect(keys).toEqual(["2026-06-20", "2026-06-15", "2026-06-10"]);
  });

  it("within a day, entries sorted by createdAt descending", () => {
    const e1 = make("2026-06-15", "2026-06-15T08:00:00Z");
    const e2 = make("2026-06-15", "2026-06-15T12:00:00Z");
    const result = groupByDay([e1, e2]);
    const day = result.get("2026-06-15")!;
    expect(day[0].createdAt).toBe("2026-06-15T12:00:00Z");
  });
});
