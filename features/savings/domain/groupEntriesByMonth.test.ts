import { describe, it, expect } from "vitest";
import { groupEntriesByMonth } from "./groupEntriesByMonth";
import type { SavingsEntry } from "./SavingsEntry";

const entry = (overrides: Partial<SavingsEntry>): SavingsEntry => ({
  id: "1",
  type: "deposito",
  amount: 100,
  date: "2026-06-01",
  toReplenish: false,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("groupEntriesByMonth", () => {
  it("returns an empty array for empty input", () => {
    expect(groupEntriesByMonth([])).toEqual([]);
  });

  it("buckets same-month entries together and different-month entries separately", () => {
    const entries = [
      entry({ id: "1", date: "2026-06-03" }),
      entry({ id: "2", date: "2026-06-17" }),
      entry({ id: "3", date: "2026-07-01" }),
    ];

    const groups = groupEntriesByMonth(entries);

    expect(groups).toHaveLength(2);
    const june = groups.find((g) => g.month === "2026-06");
    const july = groups.find((g) => g.month === "2026-07");
    expect(june?.entries.map((e) => e.id).sort()).toEqual(["1", "2"]);
    expect(july?.entries.map((e) => e.id)).toEqual(["3"]);
  });

  it("computes totalDepositos, totalGastos, and net for a mixed month", () => {
    const entries = [
      entry({ id: "1", type: "deposito", amount: 100000 }),
      entry({ id: "2", type: "deposito", amount: 50000 }),
      entry({ id: "3", type: "gasto", amount: 30000 }),
    ];

    const [group] = groupEntriesByMonth(entries);

    expect(group.totalDepositos).toBe(150000);
    expect(group.totalGastos).toBe(30000);
    expect(group.net).toBe(120000);
  });

  it("returns zero deposits and negative net for a gasto-only month", () => {
    const entries = [
      entry({ id: "1", type: "gasto", amount: 15000 }),
      entry({ id: "2", type: "gasto", amount: 25000 }),
    ];

    const [group] = groupEntriesByMonth(entries);

    expect(group.totalDepositos).toBe(0);
    expect(group.totalGastos).toBe(40000);
    expect(group.net).toBe(-40000);
    expect(group.entries).toHaveLength(2);
  });

  it("sorts groups newest-first by month", () => {
    const entries = [
      entry({ id: "1", date: "2026-05-10" }),
      entry({ id: "2", date: "2026-07-10" }),
      entry({ id: "3", date: "2026-06-10" }),
    ];

    const groups = groupEntriesByMonth(entries);

    expect(groups.map((g) => g.month)).toEqual(["2026-07", "2026-06", "2026-05"]);
  });

  it("derives the month key from date, not from any other field", () => {
    const entries = [entry({ date: "2026-05-31", createdAt: "2026-06-01T00:00:00Z" })];

    const [group] = groupEntriesByMonth(entries);

    expect(group.month).toBe("2026-05");
  });
});
