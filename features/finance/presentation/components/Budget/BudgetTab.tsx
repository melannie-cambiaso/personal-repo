"use client";

import { useState } from "react";
import { type Group } from "@/features/finance/data/kvAdapter";
import { getBudgetForMonth } from "@/features/finance/data/financeActions";
import { computeActualFromTransactions } from "@/features/finance/domain";
import type { FinanceTransaction } from "@/features/finance/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { prevMonth } from "@/shared/utils/monthUtils";

interface Props {
  groups: Group[];
  initialBudget: Record<string, number>;
  transactions: FinanceTransaction[];
  selectedMonth: string;
  onSave: (budget: Record<string, number>) => Promise<void>;
  onOpenTransaction: (category: string) => void;
}


export function BudgetTab({ groups, initialBudget, transactions, selectedMonth, onSave, onOpenTransaction }: Props) {
  const [budget, setBudget] = useState<Record<string, number>>(initialBudget);
  const [inputKey, setInputKey] = useState(0);
  const [refMonth, setRefMonth] = useState(prevMonth(selectedMonth));
  const [copying, setCopying] = useState(false);

  const actual = computeActualFromTransactions(transactions);

  const handleBlur = (category: string, raw: string) => {
    const next = { ...budget, [category]: Math.max(0, Number(raw) || 0) };
    setBudget(next);
    onSave(next);
  };

  const handleCopy = async () => {
    setCopying(true);
    const ref = await getBudgetForMonth(refMonth);
    setBudget(ref);
    setInputKey((k) => k + 1);
    onSave(ref);
    setCopying(false);
  };

  const incomeGroups = groups.filter((g) => g.type === "income");
  const expenseGroups = groups.filter((g) => g.type === "expense");

  const sumBudget = (gs: Group[]) =>
    gs.flatMap((g) => g.categories).reduce((s, c) => s + (budget[c] ?? 0), 0);
  const sumActual = (gs: Group[]) =>
    gs.flatMap((g) => g.categories).reduce((s, c) => s + (actual[c] ?? 0), 0);

  const budgetIncome = sumBudget(incomeGroups);
  const budgetExpense = sumBudget(expenseGroups);
  const actualIncome = sumActual(incomeGroups);
  const actualExpense = sumActual(expenseGroups);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 rounded-xl border border-cream-300 bg-white px-4 py-3">
        <span className="text-xs text-brown-500 whitespace-nowrap">Copiar desde</span>
        <input
          type="month"
          value={refMonth}
          max={prevMonth(selectedMonth)}
          onChange={(e) => setRefMonth(e.target.value)}
          className="flex-1 rounded-lg border border-cream-400 bg-cream-50 px-3 py-1.5 text-sm text-brown-900 outline-none focus:border-brown-600"
        />
        <button
          onClick={handleCopy}
          disabled={copying || !refMonth}
          className="cursor-pointer rounded-lg bg-brown-800 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brown-700 disabled:opacity-50"
        >
          {copying ? "Copiando..." : "Copiar"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-brown-300 bg-white">
        <div className="border-b border-cream-200 px-4 py-3">
          <span className="text-sm font-semibold text-brown-800">Balance</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          <SummaryCard label="Ingresos" budget={budgetIncome} actual={actualIncome} />
          <SummaryCard label="Gastos" budget={budgetExpense} actual={actualExpense} pendingAmount={budgetExpense - actualExpense} />
          <SummaryCard label="Neto" budget={budgetIncome - budgetExpense} actual={actualIncome - actualExpense} />
        </div>
      </div>

      <GroupSection
        title="Ingresos"
        groups={incomeGroups}
        budget={budget}
        actual={actual}
        isIncome
        inputKey={inputKey}
        onBlur={handleBlur}
        onOpenTransaction={onOpenTransaction}
      />
      <GroupSection
        title="Gastos"
        groups={expenseGroups}
        budget={budget}
        actual={actual}
        isIncome={false}
        inputKey={inputKey}
        onBlur={handleBlur}
        onOpenTransaction={onOpenTransaction}
      />
    </div>
  );
}

export function SummaryCard({ label, budget, actual, pendingAmount }: { label: string; budget: number; actual: number; pendingAmount?: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-cream-200 p-3 text-center min-h-[6rem]">
      <span className="text-2xs font-semibold uppercase tracking-wide text-brown-400">{label}</span>
      <span className="text-xs text-brown-500">Presup. {formatCLP(budget)}</span>
      <span className="text-sm font-bold text-brown-900">Real {formatCLP(actual)}</span>
      {pendingAmount !== undefined && (
        <span className={`text-xs font-semibold ${pendingAmount < 0 ? "text-red-500" : "text-brown-400"}`}>
          {pendingAmount < 0
            ? `Excedido ${formatCLP(Math.abs(pendingAmount))}`
            : `Pendiente ${formatCLP(pendingAmount)}`}
        </span>
      )}
    </div>
  );
}

function GroupSection({
  title, groups, budget, actual, isIncome, inputKey, onBlur, onOpenTransaction,
}: {
  title: string;
  groups: Group[];
  budget: Record<string, number>;
  actual: Record<string, number>;
  isIncome: boolean;
  inputKey: number;
  onBlur: (category: string, value: string) => void;
  onOpenTransaction: (category: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-brown-400">{title}</h3>
      {groups.map((g) => {
        const totalBudget = g.categories.reduce((s, c) => s + (budget[c] ?? 0), 0);
        const totalActual = g.categories.reduce((s, c) => s + (actual[c] ?? 0), 0);
        const totalDiff = isIncome ? totalActual - totalBudget : totalBudget - totalActual;

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

            {[...g.categories].sort((a, b) => a.localeCompare(b, "es")).map((cat) => {
              const planned = budget[cat] ?? 0;
              const real = actual[cat] ?? 0;
              const diff = isIncome ? real - planned : planned - real;
              return (
                <div key={cat} className="grid grid-cols-4 items-center gap-2 border-t border-cream-100 px-4 py-2">
                  <span className="text-sm text-brown-700">{cat}</span>
                  <div className="flex justify-end">
                    <input
                      type="number"
                      min="0"
                      key={`${inputKey}-b-${cat}`}
                      defaultValue={planned || ""}
                      placeholder="0"
                      onBlur={(e) => onBlur(cat, e.target.value)}
                      className="w-24 rounded-lg border border-cream-400 bg-cream-50 px-2 py-1 text-right text-sm text-brown-900 outline-none focus:border-brown-600"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-sm text-brown-900">{real > 0 ? formatCLP(real) : "—"}</span>
                    <button
                      type="button"
                      onClick={() => onOpenTransaction(cat)}
                      className="cursor-pointer rounded-md border border-cream-400 px-1.5 py-0.5 text-xs text-brown-500 transition-colors hover:border-brown-600 hover:text-brown-800"
                      aria-label={`Agregar transacción para ${cat}`}
                    >
                      +
                    </button>
                  </div>
                  <span className={`text-right text-sm font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-brown-400"}`}>
                    {diff !== 0 ? `${diff > 0 ? "+" : ""}${formatCLP(diff)}` : "—"}
                  </span>
                </div>
              );
            })}

            <div className="grid grid-cols-4 items-center gap-2 border-t border-cream-300 bg-cream-50 px-4 py-3">
              <span className="text-2xs font-semibold uppercase tracking-wide text-brown-500">Total {g.name}</span>
              <span className="text-right text-sm font-bold text-brown-900">{formatCLP(totalBudget)}</span>
              <span className="text-right text-sm font-bold text-brown-900">{formatCLP(totalActual)}</span>
              <span className={`text-right text-sm font-bold ${totalDiff > 0 ? "text-green-600" : totalDiff < 0 ? "text-red-500" : "text-brown-400"}`}>
                {totalDiff !== 0 ? `${totalDiff > 0 ? "+" : ""}${formatCLP(totalDiff)}` : "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
