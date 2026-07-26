import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFinanceV2Transactions } from "./useFinanceV2Transactions";
import type { FinanceV2Transaction } from "@/features/finance-v2/domain";

const onSave = vi.fn();

describe("useFinanceV2Transactions", () => {
  beforeEach(() => {
    onSave.mockReset();
  });

  it("initializes transactions from initialTransactions and derives totals/dayGroups", () => {
    const initialTransactions: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01" },
      { id: "t2", type: "expense", amount: 400, date: "2026-07-02", bucket: "fixed", category: null },
    ];
    const { result } = renderHook(() =>
      useFinanceV2Transactions({ initialTransactions, month: "2026-07", onSave })
    );

    expect(result.current.transactions).toEqual(initialTransactions);
    expect(result.current.totals).toEqual({ income: 1000, expense: 400, savings: 0, balance: 600 });
    expect(result.current.dayGroups.map((g) => g.date)).toEqual(["2026-07-02", "2026-07-01"]);
  });

  it("addTransaction appends a new transaction with a generated id and calls onSave once with the month and the resulting list", () => {
    const { result } = renderHook(() =>
      useFinanceV2Transactions({ initialTransactions: [], month: "2026-07", onSave })
    );

    act(() =>
      result.current.addTransaction({ type: "income", amount: 500, date: "2026-07-10" })
    );

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0]).toMatchObject({
      type: "income",
      amount: 500,
      date: "2026-07-10",
    });
    expect(typeof result.current.transactions[0].id).toBe("string");
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith("2026-07", result.current.transactions);
  });

  it("addTransaction with an expense variant carries bucket and category through", () => {
    const { result } = renderHook(() =>
      useFinanceV2Transactions({ initialTransactions: [], month: "2026-07", onSave })
    );

    act(() =>
      result.current.addTransaction({
        type: "expense",
        amount: 200,
        date: "2026-07-05",
        bucket: "variable",
        category: { id: "s1", name: "Ocio" },
      })
    );

    expect(result.current.transactions[0]).toMatchObject({
      type: "expense",
      bucket: "variable",
      category: { id: "s1", name: "Ocio" },
    });
  });

  it("addTransaction with a date outside the current month is rejected by the domain guard (list stays unchanged)", () => {
    const { result } = renderHook(() =>
      useFinanceV2Transactions({ initialTransactions: [], month: "2026-07", onSave })
    );

    act(() =>
      result.current.addTransaction({ type: "income", amount: 500, date: "2026-08-01" })
    );

    expect(result.current.transactions).toHaveLength(0);
  });

  it("deleteTransaction removes the targeted transaction and calls onSave once with the resulting list", () => {
    const initialTransactions: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01" },
      { id: "t2", type: "savings", amount: 200, date: "2026-07-02" },
    ];
    const { result } = renderHook(() =>
      useFinanceV2Transactions({ initialTransactions, month: "2026-07", onSave })
    );

    act(() => result.current.deleteTransaction("t1"));

    expect(result.current.transactions).toEqual([initialTransactions[1]]);
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith("2026-07", [initialTransactions[1]]);
  });

  it("does not use a stale closure across successive add calls", () => {
    const { result } = renderHook(() =>
      useFinanceV2Transactions({ initialTransactions: [], month: "2026-07", onSave })
    );

    act(() => {
      result.current.addTransaction({ type: "income", amount: 100, date: "2026-07-01" });
      result.current.addTransaction({ type: "income", amount: 200, date: "2026-07-02" });
    });

    expect(result.current.transactions).toHaveLength(2);
    expect(onSave).toHaveBeenCalledTimes(2);
  });
});
