import { describe, it, expect } from "vitest";
import { addTransaction, deleteTransaction, updateTransaction } from "./transactionMutations";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

describe("addTransaction", () => {
  it("unconditionally appends the transaction regardless of how its month relates to its date", () => {
    const list: FinanceV2Transaction[] = [];
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "income",
      amount: 1000,
      date: "2026-07-25",
      month: "2026-08",
    };

    const next = addTransaction(list, tx);

    expect(next).toEqual([tx]);
    expect(list).toEqual([]); // input untouched
  });

  it("appends to an existing list without mutating it", () => {
    const existing: FinanceV2Transaction = {
      id: "t1",
      type: "expense",
      amount: 500,
      date: "2026-07-01",
      month: "2026-07",
      bucket: "fixed",
      category: null,
    };
    const list: FinanceV2Transaction[] = [existing];
    const tx: FinanceV2Transaction = {
      id: "t2",
      type: "savings",
      amount: 200,
      date: "2026-07-25",
      month: "2026-07",
    };

    const next = addTransaction(list, tx);

    expect(next).toEqual([existing, tx]);
    expect(list).toEqual([existing]);
  });
});

describe("deleteTransaction", () => {
  it("removes only the targeted transaction, leaving others intact", () => {
    const t1: FinanceV2Transaction = {
      id: "t1",
      type: "income",
      amount: 1000,
      date: "2026-07-01",
      month: "2026-07",
    };
    const t2: FinanceV2Transaction = {
      id: "t2",
      type: "savings",
      amount: 200,
      date: "2026-07-02",
      month: "2026-07",
    };
    const list = [t1, t2];

    const next = deleteTransaction(list, "t1");

    expect(next).toEqual([t2]);
    expect(list).toEqual([t1, t2]); // input untouched
  });

  it("returns the list unchanged (no throw) when the id is unknown", () => {
    const t1: FinanceV2Transaction = {
      id: "t1",
      type: "income",
      amount: 1000,
      date: "2026-07-01",
      month: "2026-07",
    };
    const list = [t1];

    const next = deleteTransaction(list, "missing");

    expect(next).toEqual([t1]);
  });
});

describe("updateTransaction", () => {
  const t1: FinanceV2Transaction = {
    id: "t1",
    type: "income",
    amount: 1000,
    date: "2026-07-01",
    month: "2026-07",
  };
  const t2: FinanceV2Transaction = {
    id: "t2",
    type: "savings",
    amount: 200,
    date: "2026-07-02",
    month: "2026-07",
  };

  it("replaces the transaction with the same id, keeping its position", () => {
    const list = [t1, t2];
    const edited: FinanceV2Transaction = { ...t1, amount: 1500, note: "bonus" };

    const next = updateTransaction(list, edited);

    expect(next).toEqual([edited, t2]);
    expect(list).toEqual([t1, t2]); // input untouched
  });

  it("returns the list unchanged (no throw) when the id is unknown", () => {
    const list = [t1];
    const stranger: FinanceV2Transaction = { ...t2, id: "missing" };

    const next = updateTransaction(list, stranger);

    expect(next).toEqual([t1]);
  });
});
