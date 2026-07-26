"use client";

import { useMemo, useRef, useState } from "react";
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
}

// Fire-and-forget persist on every mutation (mirrors `useFinanceV2Budget`). `listRef`
// avoids stale closures across successive calls — same `persist*` pattern as
// `useShoppingList`/`useFinanceV2Budget`. `viewedMonth` names the CURRENTLY VIEWED month
// (the whole-list save target); a transaction's OWN `month` field is a separate,
// user-assigned value that may differ from it.
export function useFinanceV2Transactions({ initialTransactions, viewedMonth, onSave }: Params) {
  const [transactions, setTransactions] = useState<FinanceV2Transaction[]>(initialTransactions);
  const listRef = useRef(initialTransactions);

  const totals = useMemo(() => computeTransactionTotals(transactions), [transactions]);
  const dayGroups = useMemo(() => groupTransactionsByDay(transactions), [transactions]);

  const persist = (next: FinanceV2Transaction[]) => {
    listRef.current = next;
    setTransactions(next);
    void onSave(viewedMonth, next);
  };

  const addTransaction = (input: NewTransactionInput) => {
    const tx = { ...input, id: crypto.randomUUID() } as FinanceV2Transaction;
    persist(domainAddTransaction(listRef.current, tx));
  };

  const deleteTransaction = (id: string) => {
    persist(domainDeleteTransaction(listRef.current, id));
  };

  return { transactions, totals, dayGroups, addTransaction, deleteTransaction };
}
