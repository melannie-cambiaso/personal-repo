"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FinanceV2Transaction } from "@/features/finance-v2/domain";
import {
  addTransaction as domainAddTransaction,
  deleteTransaction as domainDeleteTransaction,
  computeTransactionTotals,
  groupTransactionsByDay,
} from "@/features/finance-v2/domain";

/** Distributive so a union member's shape (e.g. the `expense` variant's
 *  `bucket`/`category`) survives dropping `id` — the built-in `Omit` is NOT
 *  distributive over a discriminated union and would collapse this to the
 *  intersection of common keys only. */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type NewTransactionInput = DistributiveOmit<FinanceV2Transaction, "id">;

interface Params {
  initialTransactions: FinanceV2Transaction[];
  viewedMonth: string;
  onSave: (month: string, transactions: FinanceV2Transaction[]) => Promise<void> | void;
  onSaveToOtherMonth: (tx: FinanceV2Transaction) => Promise<void> | void;
  onLoad: (month: string) => Promise<FinanceV2Transaction[]>;
}

// Fire-and-forget persist on every mutation (mirrors `useFinanceV2Budget`). `listRef`
// avoids stale closures across successive calls — same `persist*` pattern as
// `useFinanceV2Budget`. `viewedMonth` names the CURRENTLY VIEWED month
// (the whole-list save target); a transaction's OWN `month` field is a separate,
// user-assigned value that may differ from it. The hook is the ROUTER: `tx.month ===
// loadedMonthRef.current` keeps the existing whole-list save; otherwise the transaction
// is appended to its own month's key via `onSaveToOtherMonth`, and the current list/key
// stay untouched — `lastCrossMonthSave` then drives a dismissible confirmation banner.
export function useFinanceV2Transactions({
  initialTransactions,
  viewedMonth,
  onSave,
  onSaveToOtherMonth,
  onLoad,
}: Params) {
  const [transactions, setTransactions] = useState<FinanceV2Transaction[]>(initialTransactions);
  const listRef = useRef(initialTransactions);
  const [lastCrossMonthSave, setLastCrossMonthSave] = useState<string | null>(null);

  // The month `listRef.current` actually belongs to — NOT necessarily `viewedMonth`,
  // which may already point at a month whose load is still in flight. `persist` and
  // `addTransaction`'s routing key off this ref, never off `viewedMonth` directly, so a
  // mutation during a pending load can never write month A's list into month B's key.
  const loadedMonthRef = useRef(viewedMonth);
  // Monotonic token for the ordering guard: only the response whose id still matches
  // this ref when it resolves may be applied — independent of Next's "one at a time"
  // dispatch, which its docs call a mutable implementation detail.
  const requestIdRef = useRef(0);
  // Derived at render time, NOT via a `useState` flipped inside the load effect: an
  // effect-set flag lags one render behind a `viewedMonth` change (effects run after
  // commit), so the render that produces the new `viewedMonth` would still read the old
  // "not loading" flag while `transactions` holds the previous month's list — a real,
  // user-visible stale-month race for anything computed from both during that render.
  // Comparing against `loadedMonthRef.current` has no such gap: the ref only changes once
  // `apply` runs, so it still reflects the previously loaded month during that render.
  const isLoadingMonth = loadedMonthRef.current !== viewedMonth;

  const totals = useMemo(() => computeTransactionTotals(transactions), [transactions]);
  const dayGroups = useMemo(() => groupTransactionsByDay(transactions), [transactions]);

  useEffect(() => {
    if (loadedMonthRef.current === viewedMonth) return; // mount + every unrelated re-render

    const month = viewedMonth;
    const requestId = ++requestIdRef.current;

    setLastCrossMonthSave(null);

    const apply = (list: FinanceV2Transaction[]) => {
      if (requestId !== requestIdRef.current) return; // superseded — drop silently
      loadedMonthRef.current = month;
      listRef.current = list;
      setTransactions(list);
    };

    void onLoad(month).then(apply, (error) => {
      console.error(`useFinanceV2Transactions: failed to load month "${month}"`, error);
      apply([]);
    });

    // Invalidate this request on cleanup — covers both "viewedMonth changed again
    // before this load resolved" (React runs this before the next effect body) and
    // "unmounted while a load was pending". Either way `apply` sees a stale
    // `requestId` and its late response is dropped.
    return () => {
      requestIdRef.current = requestId + 1;
    };
  }, [viewedMonth, onLoad]);

  const persist = (next: FinanceV2Transaction[]) => {
    listRef.current = next;
    setTransactions(next);
    void onSave(loadedMonthRef.current, next);
  };

  const addTransaction = (input: NewTransactionInput) => {
    const tx = { ...input, id: crypto.randomUUID() } as FinanceV2Transaction;

    if (tx.month === loadedMonthRef.current) {
      setLastCrossMonthSave(null);
      persist(domainAddTransaction(listRef.current, tx));
      return;
    }

    void onSaveToOtherMonth(tx);
    setLastCrossMonthSave(tx.month);
  };

  const deleteTransaction = (id: string) => {
    persist(domainDeleteTransaction(listRef.current, id));
  };

  const dismissCrossMonthSave = () => setLastCrossMonthSave(null);

  return {
    transactions,
    totals,
    dayGroups,
    addTransaction,
    deleteTransaction,
    lastCrossMonthSave,
    dismissCrossMonthSave,
    isLoadingMonth,
  };
}
