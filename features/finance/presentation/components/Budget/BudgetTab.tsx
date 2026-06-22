"use client";

import { useState } from "react";
import { GROUPS } from "@/features/finance/domain";

interface Props {
  initialBudget: Record<string, number>;
  byCategory: Map<string, number>;
  onSave: (budget: Record<string, number>) => Promise<void>;
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

export function BudgetTab({ initialBudget, byCategory, onSave }: Props) {
  const [budget, setBudget] = useState<Record<string, number>>(initialBudget);

  const handleBlur = (category: string, raw: string) => {
    const next = { ...budget, [category]: Math.max(0, Number(raw) || 0) };
    setBudget(next);
    onSave(next);
  };

  const incomeGroups = GROUPS.filter((g) => g.type === "income");
  const expenseGroups = GROUPS.filter((g) => g.type === "expense");

  const allCategories = (gs: (typeof GROUPS)[number][]) => gs.flatMap((g) => g.categories);
  const totalBudget = (gs: (typeof GROUPS)[number][]) =>
    allCategories(gs).reduce((s, c) => s + (budget[c] ?? 0), 0);
  const totalActual = (gs: (typeof GROUPS)[number][]) =>
    allCategories(gs).reduce((s, c) => s + (byCategory.get(c) ?? 0), 0);

  const budgetIncome = totalBudget(incomeGroups);
  const budgetExpense = totalBudget(expenseGroups);
  const actualIncome = totalActual(incomeGroups);
  const actualExpense = totalActual(expenseGroups);

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-brown-300 bg-white">
        <div className="border-b border-cream-200 px-4 py-3">
          <span className="text-sm font-semibold text-brown-800">Balance</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          <SummaryCard label="Ingresos" budget={budgetIncome} actual={actualIncome} positive />
          <SummaryCard label="Gastos" budget={budgetExpense} actual={actualExpense} positive={false} />
          <SummaryCard label="Neto" budget={budgetIncome - budgetExpense} actual={actualIncome - actualExpense} positive />
        </div>
      </div>

      <GroupSection title="Ingresos" groups={incomeGroups} budget={budget} byCategory={byCategory} type="income" onBlur={handleBlur} />
      <GroupSection title="Gastos" groups={expenseGroups} budget={budget} byCategory={byCategory} type="expense" onBlur={handleBlur} />
    </div>
  );
}

function SummaryCard({ label, budget, actual, positive }: { label: string; budget: number; actual: number; positive: boolean }) {
  const diff = positive ? actual - budget : budget - actual;
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-cream-200 p-3 text-center">
      <span className="text-2xs font-semibold uppercase tracking-wide text-brown-400">{label}</span>
      <span className="text-xs text-brown-500">Presup. {fmt(budget)}</span>
      <span className="text-sm font-bold text-brown-900">Real {fmt(actual)}</span>
      <span className={`text-xs font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-brown-400"}`}>
        {diff !== 0 ? `${diff > 0 ? "+" : ""}${fmt(diff)}` : "—"}
      </span>
    </div>
  );
}

function GroupSection({
  title, groups, budget, byCategory, type, onBlur,
}: {
  title: string;
  groups: (typeof GROUPS)[number][];
  budget: Record<string, number>;
  byCategory: Map<string, number>;
  type: "income" | "expense";
  onBlur: (category: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-brown-400">{title}</h3>
      {groups.map((g) => {
        const totalBudget = g.categories.reduce((s, c) => s + (budget[c] ?? 0), 0);
        const totalActual = g.categories.reduce((s, c) => s + (byCategory.get(c) ?? 0), 0);
        const totalDiff = type === "income" ? totalActual - totalBudget : totalBudget - totalActual;

        return (
          <div key={g.name} className="overflow-hidden rounded-xl border border-cream-300 bg-white">
            <div className="border-b border-cream-200 px-4 py-3">
              <span className="text-sm font-semibold text-brown-800">{g.name}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-brown-400">
              <span>Categoría</span>
              <span className="text-right">Presupuesto</span>
              <span className="text-right">Real</span>
              <span className="text-right">Diferencia</span>
            </div>

            {g.categories.map((cat) => {
              const actual = byCategory.get(cat) ?? 0;
              const planned = budget[cat] ?? 0;
              const diff = type === "income" ? actual - planned : planned - actual;
              return (
                <div key={cat} className="grid grid-cols-4 items-center gap-2 border-t border-cream-100 px-4 py-2">
                  <span className="text-sm text-brown-700">{cat}</span>
                  <div className="flex justify-end">
                    <input
                      type="number"
                      min="0"
                      defaultValue={planned || ""}
                      placeholder="0"
                      onBlur={(e) => onBlur(cat, e.target.value)}
                      className="w-28 rounded-lg border border-cream-400 bg-cream-50 px-2 py-1 text-right text-sm text-brown-900 outline-none focus:border-brown-600"
                    />
                  </div>
                  <span className="text-right text-sm text-brown-700">{actual > 0 ? fmt(actual) : "—"}</span>
                  <span className={`text-right text-sm font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-brown-400"}`}>
                    {diff !== 0 ? `${diff > 0 ? "+" : ""}${fmt(diff)}` : "—"}
                  </span>
                </div>
              );
            })}

            <div className="grid grid-cols-4 items-center gap-2 border-t border-cream-300 bg-cream-50 px-4 py-3">
              <span className="text-2xs font-semibold uppercase tracking-wide text-brown-500">Total {g.name}</span>
              <span className="text-right text-sm font-bold text-brown-900">{fmt(totalBudget)}</span>
              <span className="text-right text-sm font-bold text-brown-900">{fmt(totalActual)}</span>
              <span className={`text-right text-sm font-bold ${totalDiff > 0 ? "text-green-600" : totalDiff < 0 ? "text-red-500" : "text-brown-400"}`}>
                {totalDiff !== 0 ? `${totalDiff > 0 ? "+" : ""}${fmt(totalDiff)}` : "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
