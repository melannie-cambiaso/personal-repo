"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import type { SavingsPeriod } from "@/features/savings/domain/SavingsPeriod";
import { computePeriodBalance, computeTotalToReplenish } from "@/features/savings/domain";

const ZERO_INITIAL_AMOUNT_PERIOD: SavingsPeriod = {
  id: "",
  startedAt: "",
  initialAmount: 0,
};

interface Params {
  initialEntries: SavingsEntry[];
  onSave: (entries: SavingsEntry[]) => Promise<void> | void;
  period?: SavingsPeriod;
}

export function useSavings({ initialEntries, onSave, period }: Params) {
  const [entries, setEntries] = useState<SavingsEntry[]>(initialEntries);
  const entriesRef = useRef(initialEntries);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const dateDiff = b.date.localeCompare(a.date);
        return dateDiff !== 0 ? dateDiff : b.createdAt.localeCompare(a.createdAt);
      }),
    [entries]
  );

  const balance = useMemo(
    () => computePeriodBalance(entries, period ?? ZERO_INITIAL_AMOUNT_PERIOD),
    [entries, period]
  );
  const totalToReplenish = useMemo(() => computeTotalToReplenish(entries), [entries]);
  const totalDepositos = useMemo(
    () => entries.filter((e) => e.type === "deposito").reduce((s, e) => s + e.amount, 0),
    [entries]
  );
  const totalGastos = useMemo(
    () => entries.filter((e) => e.type === "gasto").reduce((s, e) => s + e.amount, 0),
    [entries]
  );

  const addEntry = (entry: SavingsEntry) => {
    const sanitized = entry.type === "deposito" ? { ...entry, toReplenish: false } : entry;
    const next = [...entriesRef.current, sanitized];
    entriesRef.current = next;
    setEntries(next);
    void onSave(next);
  };

  const editEntry = (updated: SavingsEntry) => {
    const sanitized = updated.type === "deposito" ? { ...updated, toReplenish: false } : updated;
    const next = entriesRef.current.map((e) => (e.id === sanitized.id ? sanitized : e));
    entriesRef.current = next;
    setEntries(next);
    void onSave(next);
  };

  const deleteEntry = (id: string) => {
    const next = entriesRef.current.filter((e) => e.id !== id);
    entriesRef.current = next;
    setEntries(next);
    void onSave(next);
  };

  const markReplenished = (id: string) => {
    const entry = entriesRef.current.find((e) => e.id === id);
    if (!entry) return;
    editEntry({ ...entry, toReplenish: false });
  };

  return {
    entries: sortedEntries,
    balance,
    totalToReplenish,
    totalDepositos,
    totalGastos,
    addEntry,
    editEntry,
    deleteEntry,
    markReplenished,
  };
}
