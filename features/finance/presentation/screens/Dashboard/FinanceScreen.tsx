"use client";

import { useState, useEffect } from "react";
import { getBudgetForMonth, getActualForMonth } from "@/features/finance/data/financeActions";
import { BudgetTab, FinanceMonthNav } from "../../components";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";

interface Props {
  initialBudget: Record<string, number>;
  initialActual: Record<string, number>;
  onSaveBudget: (month: string, budget: Record<string, number>) => Promise<void>;
  onSaveActual: (month: string, actual: Record<string, number>) => Promise<void>;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
}

function nextMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
}

export function FinanceScreen({ initialBudget, initialActual, onSaveBudget, onSaveActual }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth());
  const [monthBudget, setMonthBudget] = useState<Record<string, number>>(initialBudget);
  const [monthActual, setMonthActual] = useState<Record<string, number>>(initialActual);
  const [budgetLoadedFor, setBudgetLoadedFor] = useState(selectedMonth);

  useEffect(() => {
    if (budgetLoadedFor === selectedMonth) return;
    Promise.all([
      getBudgetForMonth(selectedMonth),
      getActualForMonth(selectedMonth),
    ]).then(([b, a]) => {
      setMonthBudget(b);
      setMonthActual(a);
      setBudgetLoadedFor(selectedMonth);
    });
  }, [selectedMonth, budgetLoadedFor]);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Tus finanzas" title="Finanzas" />

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <FinanceMonthNav
          selectedMonth={selectedMonth}
          onPrev={() => setSelectedMonth(prevMonth(selectedMonth))}
          onNext={() => setSelectedMonth(nextMonth(selectedMonth))}
        />

        <BudgetTab
          key={budgetLoadedFor}
          initialBudget={monthBudget}
          initialActual={monthActual}
          selectedMonth={selectedMonth}
          onSave={(b) => onSaveBudget(selectedMonth, b)}
          onSaveActual={(a) => onSaveActual(selectedMonth, a)}
        />
      </div>
    </main>
  );
}
