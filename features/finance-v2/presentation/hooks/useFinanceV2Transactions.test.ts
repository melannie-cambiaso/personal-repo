import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFinanceV2Transactions } from "./useFinanceV2Transactions";
import type { FinanceV2Transaction } from "@/features/finance-v2/domain";

const onSave = vi.fn();
const onSaveToOtherMonth = vi.fn();
const onLoad = vi.fn();

/** A promise whose resolution is controlled from the test body — used to assert
 *  behaviour WHILE a `handleLoadTransactions` call is still in flight. */
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useFinanceV2Transactions", () => {
  beforeEach(() => {
    onSave.mockReset();
    onSaveToOtherMonth.mockReset();
    onLoad.mockReset();
    onLoad.mockResolvedValue([]);
  });

  it("initializes transactions from initialTransactions and derives totals/dayGroups", () => {
    const initialTransactions: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
      {
        id: "t2",
        type: "expense",
        amount: 400,
        date: "2026-07-02",
        month: "2026-07",
        bucket: "fixed",
        category: null,
      },
    ];
    const { result } = renderHook(() =>
      useFinanceV2Transactions({
        initialTransactions,
        viewedMonth: "2026-07",
        onSave,
        onSaveToOtherMonth,
        onLoad,
      })
    );

    expect(result.current.transactions).toEqual(initialTransactions);
    expect(result.current.totals).toEqual({
      income: 1000,
      expense: 400,
      savings: 0,
      transfer: 0,
      balance: 600,
    });
    expect(result.current.dayGroups.map((g) => g.date)).toEqual(["2026-07-02", "2026-07-01"]);
  });

  it("addTransaction appends a new transaction with a generated id and calls onSave once with the viewed month and the resulting list", () => {
    const { result } = renderHook(() =>
      useFinanceV2Transactions({
        initialTransactions: [],
        viewedMonth: "2026-07",
        onSave,
        onSaveToOtherMonth,
        onLoad,
      })
    );

    act(() =>
      result.current.addTransaction({
        type: "income",
        amount: 500,
        date: "2026-07-10",
        month: "2026-07",
      })
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
      useFinanceV2Transactions({
        initialTransactions: [],
        viewedMonth: "2026-07",
        onSave,
        onSaveToOtherMonth,
        onLoad,
      })
    );

    act(() =>
      result.current.addTransaction({
        type: "expense",
        amount: 200,
        date: "2026-07-05",
        month: "2026-07",
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

  it("deleteTransaction removes the targeted transaction and calls onSave once with the resulting list", () => {
    const initialTransactions: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
      { id: "t2", type: "savings", amount: 200, date: "2026-07-02", month: "2026-07" },
    ];
    const { result } = renderHook(() =>
      useFinanceV2Transactions({
        initialTransactions,
        viewedMonth: "2026-07",
        onSave,
        onSaveToOtherMonth,
        onLoad,
      })
    );

    act(() => result.current.deleteTransaction("t1"));

    expect(result.current.transactions).toEqual([initialTransactions[1]]);
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith("2026-07", [initialTransactions[1]]);
  });

  it("does not use a stale closure across successive add calls", () => {
    const { result } = renderHook(() =>
      useFinanceV2Transactions({
        initialTransactions: [],
        viewedMonth: "2026-07",
        onSave,
        onSaveToOtherMonth,
        onLoad,
      })
    );

    act(() => {
      result.current.addTransaction({
        type: "income",
        amount: 100,
        date: "2026-07-01",
        month: "2026-07",
      });
      result.current.addTransaction({
        type: "income",
        amount: 200,
        date: "2026-07-02",
        month: "2026-07",
      });
    });

    expect(result.current.transactions).toHaveLength(2);
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it("same-month add calls onSave, not onSaveToOtherMonth, and lastCrossMonthSave stays null", () => {
    const { result } = renderHook(() =>
      useFinanceV2Transactions({
        initialTransactions: [],
        viewedMonth: "2026-07",
        onSave,
        onSaveToOtherMonth,
        onLoad,
      })
    );

    act(() =>
      result.current.addTransaction({
        type: "income",
        amount: 500,
        date: "2026-07-10",
        month: "2026-07",
      })
    );

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSaveToOtherMonth).not.toHaveBeenCalled();
    expect(result.current.lastCrossMonthSave).toBeNull();
  });

  it("cross-month add calls onSaveToOtherMonth, not onSave, leaves the list unchanged, and sets lastCrossMonthSave", () => {
    const { result } = renderHook(() =>
      useFinanceV2Transactions({
        initialTransactions: [],
        viewedMonth: "2026-07",
        onSave,
        onSaveToOtherMonth,
        onLoad,
      })
    );

    act(() =>
      result.current.addTransaction({
        type: "income",
        amount: 500,
        date: "2026-07-31",
        month: "2026-08",
      })
    );

    expect(onSaveToOtherMonth).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.transactions).toHaveLength(0);
    expect(result.current.lastCrossMonthSave).toBe("2026-08");
  });

  it("lastCrossMonthSave is cleared by a subsequent same-month add", () => {
    const { result } = renderHook(() =>
      useFinanceV2Transactions({
        initialTransactions: [],
        viewedMonth: "2026-07",
        onSave,
        onSaveToOtherMonth,
        onLoad,
      })
    );

    act(() =>
      result.current.addTransaction({
        type: "income",
        amount: 500,
        date: "2026-07-31",
        month: "2026-08",
      })
    );
    expect(result.current.lastCrossMonthSave).toBe("2026-08");

    act(() =>
      result.current.addTransaction({
        type: "income",
        amount: 200,
        date: "2026-07-01",
        month: "2026-07",
      })
    );

    expect(result.current.lastCrossMonthSave).toBeNull();
  });

  it("dismissCrossMonthSave clears lastCrossMonthSave", () => {
    const { result } = renderHook(() =>
      useFinanceV2Transactions({
        initialTransactions: [],
        viewedMonth: "2026-07",
        onSave,
        onSaveToOtherMonth,
        onLoad,
      })
    );

    act(() =>
      result.current.addTransaction({
        type: "income",
        amount: 500,
        date: "2026-07-31",
        month: "2026-08",
      })
    );
    expect(result.current.lastCrossMonthSave).toBe("2026-08");

    act(() => result.current.dismissCrossMonthSave());

    expect(result.current.lastCrossMonthSave).toBeNull();
  });

  it("re-fetches and replaces transactions/totals/dayGroups when viewedMonth changes", async () => {
    const julyTransactions: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
    ];
    const augustTransactions: FinanceV2Transaction[] = [
      { id: "t2", type: "income", amount: 2000, date: "2026-08-01", month: "2026-08" },
      { id: "t3", type: "expense", amount: 500, date: "2026-08-02", month: "2026-08", bucket: "fixed", category: null },
    ];
    onLoad.mockResolvedValueOnce(augustTransactions);

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Transactions({
          initialTransactions: julyTransactions,
          viewedMonth,
          onSave,
          onSaveToOtherMonth,
          onLoad,
        }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    expect(result.current.transactions).toEqual(julyTransactions);

    await act(async () => {
      rerender({ viewedMonth: "2026-08" });
      await Promise.resolve();
    });

    expect(onLoad).toHaveBeenCalledWith("2026-08");
    expect(result.current.transactions).toEqual(augustTransactions);
    expect(result.current.totals).toEqual({
      income: 2000,
      expense: 500,
      savings: 0,
      transfer: 0,
      balance: 1500,
    });
    expect(result.current.dayGroups.map((g) => g.date)).toEqual(["2026-08-02", "2026-08-01"]);
  });

  it("clears lastCrossMonthSave synchronously when viewedMonth changes, before onLoad resolves", async () => {
    const deferred = createDeferred<FinanceV2Transaction[]>();
    onLoad.mockReturnValueOnce(deferred.promise);

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth,
          onSave,
          onSaveToOtherMonth,
          onLoad,
        }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    act(() =>
      result.current.addTransaction({
        type: "income",
        amount: 500,
        date: "2026-07-31",
        month: "2026-08",
      })
    );
    expect(result.current.lastCrossMonthSave).toBe("2026-08");

    act(() => {
      rerender({ viewedMonth: "2026-09" });
    });

    expect(result.current.lastCrossMonthSave).toBeNull();

    await act(async () => {
      deferred.resolve([]);
      await deferred.promise;
    });
  });

  it("ordering guard: an older in-flight response resolving after a newer one does not win", async () => {
    const augustDeferred = createDeferred<FinanceV2Transaction[]>();
    const septemberDeferred = createDeferred<FinanceV2Transaction[]>();
    const augustTransactions: FinanceV2Transaction[] = [
      { id: "aug", type: "income", amount: 111, date: "2026-08-01", month: "2026-08" },
    ];
    const septemberTransactions: FinanceV2Transaction[] = [
      { id: "sep", type: "income", amount: 222, date: "2026-09-01", month: "2026-09" },
    ];
    onLoad.mockReturnValueOnce(augustDeferred.promise);
    onLoad.mockReturnValueOnce(septemberDeferred.promise);

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth,
          onSave,
          onSaveToOtherMonth,
          onLoad,
        }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    act(() => {
      rerender({ viewedMonth: "2026-08" });
    });
    act(() => {
      rerender({ viewedMonth: "2026-09" });
    });

    await act(async () => {
      septemberDeferred.resolve(septemberTransactions);
      await septemberDeferred.promise;
    });
    await act(async () => {
      augustDeferred.resolve(augustTransactions);
      await augustDeferred.promise;
    });

    expect(result.current.transactions).toEqual(septemberTransactions);
  });

  it("A->B->A round trip: navigating back before B resolves is not overwritten by B's late response", async () => {
    const julyTransactions: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
    ];
    const augustTransactions: FinanceV2Transaction[] = [
      { id: "t2", type: "income", amount: 2000, date: "2026-08-01", month: "2026-08" },
    ];
    const augustDeferred = createDeferred<FinanceV2Transaction[]>();
    onLoad.mockReturnValueOnce(augustDeferred.promise);

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Transactions({
          initialTransactions: julyTransactions,
          viewedMonth,
          onSave,
          onSaveToOtherMonth,
          onLoad,
        }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    // Navigate to August — load starts, still pending.
    act(() => {
      rerender({ viewedMonth: "2026-08" });
    });

    // Navigate back to July before August resolves — already loaded, no new fetch,
    // and August's in-flight request must be invalidated by cleanup.
    act(() => {
      rerender({ viewedMonth: "2026-07" });
    });

    expect(onLoad).toHaveBeenCalledOnce();
    expect(result.current.transactions).toEqual(julyTransactions);

    // August's deferred promise resolves late — its stale response must be dropped.
    await act(async () => {
      augustDeferred.resolve(augustTransactions);
      await augustDeferred.promise;
    });

    expect(result.current.transactions).toEqual(julyTransactions);
  });

  it("corruption guard: a delete during a pending load persists via the previously loaded month, not the requested one", async () => {
    const julyTransactions: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
    ];
    const deferred = createDeferred<FinanceV2Transaction[]>();
    onLoad.mockReturnValueOnce(deferred.promise);

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Transactions({
          initialTransactions: julyTransactions,
          viewedMonth,
          onSave,
          onSaveToOtherMonth,
          onLoad,
        }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    act(() => {
      rerender({ viewedMonth: "2026-08" });
    });

    act(() => result.current.deleteTransaction("t1"));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith("2026-07", []);

    await act(async () => {
      deferred.resolve([]);
      await deferred.promise;
    });
  });

  it("cross-month add during a pending load still routes through onSaveToOtherMonth, not the in-memory list", async () => {
    // `tx.month` deliberately equals the pending `viewedMonth` ("2026-08"), NOT
    // `loadedMonthRef.current` (still "2026-07"). Under the old `tx.month === viewedMonth`
    // routing this would be misrouted as a same-month, in-memory persist; the correct
    // `tx.month === loadedMonthRef.current` routing must still send it to
    // `onSaveToOtherMonth`. This is what actually discriminates old vs. new routing —
    // a third, unrelated month would pass under either implementation.
    const deferred = createDeferred<FinanceV2Transaction[]>();
    onLoad.mockReturnValueOnce(deferred.promise);

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth,
          onSave,
          onSaveToOtherMonth,
          onLoad,
        }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    act(() => {
      rerender({ viewedMonth: "2026-08" });
    });

    act(() =>
      result.current.addTransaction({
        type: "income",
        amount: 300,
        date: "2026-08-15",
        month: "2026-08",
      })
    );

    expect(onSaveToOtherMonth).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.transactions).toEqual([]);
    expect(result.current.lastCrossMonthSave).toBe("2026-08");

    await act(async () => {
      deferred.resolve([]);
      await deferred.promise;
    });
  });

  it("isLoadingMonth is already true in the very render triggered by a viewedMonth change — before the load effect runs (no stale-month gap)", async () => {
    const deferred = createDeferred<FinanceV2Transaction[]>();
    onLoad.mockReturnValueOnce(deferred.promise);

    const renders: { viewedMonth: string; isLoadingMonth: boolean }[] = [];

    const { rerender } = renderHook(
      ({ viewedMonth }) => {
        const result = useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth,
          onSave,
          onSaveToOtherMonth,
          onLoad,
        });
        renders.push({ viewedMonth, isLoadingMonth: result.isLoadingMonth });
        return result;
      },
      { initialProps: { viewedMonth: "2026-07" } }
    );

    act(() => {
      rerender({ viewedMonth: "2026-08" });
    });

    // The FIRST render captured for "2026-08" is produced synchronously by `rerender`
    // itself — before the `useEffect` that kicks off `onLoad` has had a chance to run.
    // If `isLoadingMonth` were still a `useState` flipped to `true` from inside that
    // effect, this render would read `isLoadingMonth: false` while `transactions` still
    // holds July's list: the exact stale-month race a consumer computing a comparison
    // during render would hit. Deriving it synchronously from
    // `loadedMonthRef.current !== viewedMonth` instead closes that gap.
    const firstAugustRender = renders.find((r) => r.viewedMonth === "2026-08");
    expect(firstAugustRender?.isLoadingMonth).toBe(true);

    await act(async () => {
      deferred.resolve([]);
      await deferred.promise;
    });
  });

  it("a rejected onLoad applies an empty list and does not leave the previous month's data rendered", async () => {
    const julyTransactions: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
    ];
    onLoad.mockRejectedValueOnce(new Error("transport failure"));

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Transactions({
          initialTransactions: julyTransactions,
          viewedMonth,
          onSave,
          onSaveToOtherMonth,
          onLoad,
        }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    await act(async () => {
      rerender({ viewedMonth: "2026-08" });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.transactions).toEqual([]);
  });

  describe("envelope funding stamp (resolvePaidFrom)", () => {
    const expenseInput = (categoryId: string | null) => ({
      type: "expense" as const,
      amount: 43_000,
      date: "2026-07-05",
      month: "2026-07",
      bucket: "fixed" as const,
      category: categoryId === null ? null : { id: categoryId, name: "Luz" },
    });

    it("stamps paidFrom on an expense the resolver assigns to the envelope", () => {
      const resolvePaidFrom = vi.fn().mockReturnValue("envelope");
      const { result } = renderHook(() =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth: "2026-07",
          onSave,
          onSaveToOtherMonth,
          onLoad,
          resolvePaidFrom,
        })
      );

      act(() => result.current.addTransaction(expenseInput("luz")));

      expect(resolvePaidFrom).toHaveBeenCalledWith("luz");
      expect(result.current.transactions[0]).toMatchObject({ paidFrom: "envelope" });
      expect(onSave.mock.calls[0][1][0]).toMatchObject({ paidFrom: "envelope" });
    });

    it("passes null to the resolver for an uncategorized expense", () => {
      const resolvePaidFrom = vi.fn().mockReturnValue(undefined);
      const { result } = renderHook(() =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth: "2026-07",
          onSave,
          onSaveToOtherMonth,
          onLoad,
          resolvePaidFrom,
        })
      );

      act(() => result.current.addTransaction(expenseInput(null)));

      expect(resolvePaidFrom).toHaveBeenCalledWith(null);
    });

    // Absent, not `paidFrom: undefined`: legacy records have no key at all, and the
    // stored shape should not depend on whether an envelope exists.
    it("never adds the paidFrom key when the resolver returns undefined", () => {
      const { result } = renderHook(() =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth: "2026-07",
          onSave,
          onSaveToOtherMonth,
          onLoad,
          resolvePaidFrom: () => undefined,
        })
      );

      act(() => result.current.addTransaction(expenseInput("ocio")));

      expect("paidFrom" in result.current.transactions[0]).toBe(false);
    });

    it("never adds the paidFrom key when no resolver is given", () => {
      const { result } = renderHook(() =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth: "2026-07",
          onSave,
          onSaveToOtherMonth,
          onLoad,
        })
      );

      act(() => result.current.addTransaction(expenseInput("luz")));

      expect("paidFrom" in result.current.transactions[0]).toBe(false);
    });

    it("only consults the resolver for expenses", () => {
      const resolvePaidFrom = vi.fn().mockReturnValue("envelope");
      const { result } = renderHook(() =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth: "2026-07",
          onSave,
          onSaveToOtherMonth,
          onLoad,
          resolvePaidFrom,
        })
      );

      act(() => {
        result.current.addTransaction({
          type: "savings",
          amount: 100,
          date: "2026-07-01",
          month: "2026-07",
          sourceCategory: { id: "luz", name: "Luz", bucket: "fixed" },
        });
        result.current.addTransaction({
          type: "transfer",
          amount: 116_000,
          date: "2026-07-01",
          month: "2026-07",
        });
      });

      expect(resolvePaidFrom).not.toHaveBeenCalled();
      expect(result.current.transactions.some((tx) => "paidFrom" in tx)).toBe(false);
    });

    it("stamps a cross-month expense too, before it is appended to its own month", () => {
      const { result } = renderHook(() =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth: "2026-07",
          onSave,
          onSaveToOtherMonth,
          onLoad,
          resolvePaidFrom: () => "envelope",
        })
      );

      act(() => result.current.addTransaction({ ...expenseInput("luz"), month: "2026-06" }));

      expect(onSaveToOtherMonth).toHaveBeenCalledWith(
        expect.objectContaining({ month: "2026-06", paidFrom: "envelope" })
      );
    });
  });

  describe("onCrossMonthSaved", () => {
    const crossMonthInput = {
      type: "income" as const,
      amount: 500,
      date: "2026-06-30",
      month: "2026-06",
    };

    it("is called with the target month only AFTER onSaveToOtherMonth resolves", async () => {
      const save = createDeferred<void>();
      onSaveToOtherMonth.mockReturnValueOnce(save.promise);
      const onCrossMonthSaved = vi.fn();
      const { result } = renderHook(() =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth: "2026-07",
          onSave,
          onSaveToOtherMonth,
          onLoad,
          onCrossMonthSaved,
        })
      );

      act(() => result.current.addTransaction(crossMonthInput));
      await act(async () => {
        await Promise.resolve();
      });

      expect(onCrossMonthSaved).not.toHaveBeenCalled();

      await act(async () => {
        save.resolve();
        await save.promise;
      });

      expect(onCrossMonthSaved).toHaveBeenCalledOnce();
      expect(onCrossMonthSaved).toHaveBeenCalledWith("2026-06");
    });

    it("works with a synchronous (void) onSaveToOtherMonth", async () => {
      const onCrossMonthSaved = vi.fn();
      const { result } = renderHook(() =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth: "2026-07",
          onSave,
          onSaveToOtherMonth,
          onLoad,
          onCrossMonthSaved,
        })
      );

      await act(async () => {
        result.current.addTransaction(crossMonthInput);
        await Promise.resolve();
      });

      expect(onCrossMonthSaved).toHaveBeenCalledWith("2026-06");
    });

    it("is not called when onSaveToOtherMonth rejects", async () => {
      const save = createDeferred<void>();
      onSaveToOtherMonth.mockReturnValueOnce(save.promise);
      const onCrossMonthSaved = vi.fn();
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHook(() =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth: "2026-07",
          onSave,
          onSaveToOtherMonth,
          onLoad,
          onCrossMonthSaved,
        })
      );

      act(() => result.current.addTransaction(crossMonthInput));
      await act(async () => {
        save.reject(new Error("transport failure"));
        await save.promise.catch(() => {});
        await Promise.resolve();
      });

      expect(onCrossMonthSaved).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("is not called for a same-month add", async () => {
      const onCrossMonthSaved = vi.fn();
      const { result } = renderHook(() =>
        useFinanceV2Transactions({
          initialTransactions: [],
          viewedMonth: "2026-07",
          onSave,
          onSaveToOtherMonth,
          onLoad,
          onCrossMonthSaved,
        })
      );

      await act(async () => {
        result.current.addTransaction({ ...crossMonthInput, month: "2026-07" });
        await Promise.resolve();
      });

      expect(onCrossMonthSaved).not.toHaveBeenCalled();
    });
  });
});
