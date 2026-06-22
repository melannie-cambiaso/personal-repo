"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FinanceEntry } from "@/features/finance/domain/FinanceEntry";
import { filterByMonth, computeMonthSummary, groupByDay, getGroupForCategory } from "@/features/finance/domain";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function navigateMonth(current: string, dir: 1 | -1): string {
  const [y, m] = current.split("-").map(Number);
  const d = new Date(y, m - 1 + dir, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface Params {
  initialEntries: FinanceEntry[];
  onSave: (entries: FinanceEntry[]) => Promise<void> | void;
}

export function useFinance({ initialEntries, onSave }: Params) {
  const [entries, setEntries] = useState<FinanceEntry[]>(initialEntries);
  const entriesRef = useRef(initialEntries);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  useEffect(() => { entriesRef.current = entries; }, [entries]);

  const monthEntries = useMemo(
    () => filterByMonth(entries, selectedMonth),
    [entries, selectedMonth],
  );
  const summary = useMemo(() => computeMonthSummary(monthEntries), [monthEntries]);
  const groupedByDay = useMemo(() => groupByDay(monthEntries), [monthEntries]);

  const goToPrevMonth = () => setSelectedMonth((m) => navigateMonth(m, -1));
  const goToNextMonth = () => setSelectedMonth((m) => navigateMonth(m, 1));

  const addEntry = (entry: FinanceEntry) => {
    const withGroup = { ...entry, group: getGroupForCategory(entry.category) };
    const next = [...entriesRef.current, withGroup];
    entriesRef.current = next;
    setEntries(next);
    void onSave(next);
  };

  const editEntry = (updated: FinanceEntry) => {
    const withGroup = { ...updated, group: getGroupForCategory(updated.category) };
    const next = entriesRef.current.map((e) => (e.id === withGroup.id ? withGroup : e));
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

  return {
    entries,
    selectedMonth,
    monthEntries,
    summary,
    groupedByDay,
    goToPrevMonth,
    goToNextMonth,
    addEntry,
    editEntry,
    deleteEntry,
  };
}
