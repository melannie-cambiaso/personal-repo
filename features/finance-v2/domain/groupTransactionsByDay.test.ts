import { describe, it, expect } from "vitest";
import { groupTransactionsByDay } from "./groupTransactionsByDay";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

const tx = (id: string, date: string): FinanceV2Transaction => ({
  id,
  type: "income",
  amount: 100,
  date,
});

describe("groupTransactionsByDay", () => {
  it("returns an empty array for an empty list", () => {
    expect(groupTransactionsByDay([])).toEqual([]);
  });

  it("groups transactions under their date, days sorted descending", () => {
    const list = [tx("t1", "2026-07-01"), tx("t2", "2026-07-25"), tx("t3", "2026-07-10")];

    const groups = groupTransactionsByDay(list);

    expect(groups.map((g) => g.date)).toEqual(["2026-07-25", "2026-07-10", "2026-07-01"]);
  });

  it("within a day, orders transactions in REVERSE insertion order (most recently added first)", () => {
    const list = [tx("t1", "2026-07-10"), tx("t2", "2026-07-10"), tx("t3", "2026-07-10")];

    const groups = groupTransactionsByDay(list);

    expect(groups).toHaveLength(1);
    expect(groups[0].transactions.map((t) => t.id)).toEqual(["t3", "t2", "t1"]);
  });

  it("mixes multi-day grouping with within-day reverse order", () => {
    const list = [
      tx("a", "2026-07-01"),
      tx("b", "2026-07-05"),
      tx("c", "2026-07-01"),
      tx("d", "2026-07-05"),
    ];

    const groups = groupTransactionsByDay(list);

    expect(groups.map((g) => g.date)).toEqual(["2026-07-05", "2026-07-01"]);
    expect(groups[0].transactions.map((t) => t.id)).toEqual(["d", "b"]);
    expect(groups[1].transactions.map((t) => t.id)).toEqual(["c", "a"]);
  });
});
