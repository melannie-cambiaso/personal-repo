"use client";

import { useState } from "react";
import { type Group } from "@/features/finance/data/kvAdapter";
import { getBudgetForMonth, toggleClosedCategory } from "@/features/finance/data/financeActions";
import {
  computeActualFromTransactions,
  computeBudgetSummary,
  computePendingExpenses,
} from "@/features/finance/domain";
import type { FinanceTransaction } from "@/features/finance/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { prevMonth } from "@/shared/utils/monthUtils";

interface Props {
  groups: Group[];
  initialBudget: Record<string, number>;
  transactions: FinanceTransaction[];
  selectedMonth: string;
  initialClosedCategories?: string[];
  onSave: (budget: Record<string, number>) => Promise<void>;
  onOpenTransaction: (category: string) => void;
}

export function BudgetTab({
  groups,
  initialBudget,
  transactions,
  selectedMonth,
  initialClosedCategories = [],
  onSave,
  onOpenTransaction,
}: Props) {
  const [budget, setBudget] = useState<Record<string, number>>(initialBudget);
  const [inputKey, setInputKey] = useState(0);
  const [refMonth, setRefMonth] = useState(prevMonth(selectedMonth));
  const [copying, setCopying] = useState(false);
  const [closedCategories, setClosedCategories] = useState<string[]>(initialClosedCategories);

  const actual = computeActualFromTransactions(transactions);

  const handleBlur = (category: string, raw: string) => {
    const next = { ...budget, [category]: Math.max(0, Number(raw) || 0) };
    setBudget(next);
    onSave(next);
  };

  const handleToggleClose = (category: string) => {
    const next = closedCategories.includes(category)
      ? closedCategories.filter((c) => c !== category)
      : [...closedCategories, category];
    setClosedCategories(next);
    void toggleClosedCategory(selectedMonth, category);
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
  const refundGroups = groups.filter((g) => g.type === "refund");
  const expenseGroups = groups.filter((g) => g.type === "expense");

  const sumBudget = (gs: Group[]) =>
    gs.flatMap((g) => g.categories).reduce((s, c) => s + (budget[c] ?? 0), 0);
  const sumActual = (gs: Group[]) =>
    gs.flatMap((g) => g.categories).reduce((s, c) => s + (actual[c] ?? 0), 0);

  const budgetIncome = sumBudget(incomeGroups);
  const budgetRefund = sumBudget(refundGroups);
  const budgetExpense = sumBudget(expenseGroups);
  const actualIncome = sumActual(incomeGroups);
  const actualRefund = sumActual(refundGroups);
  const actualExpense = sumActual(expenseGroups);

  const allExpenseCategories = expenseGroups.flatMap((g) => g.categories);
  const pendingExpenses = computePendingExpenses(
    budget,
    actual,
    allExpenseCategories,
    closedCategories
  );
  const pendingAmount =
    actualExpense > budgetExpense ? -(actualExpense - budgetExpense) : pendingExpenses;

  const { actualNet, available, potentialSavings } = computeBudgetSummary({
    actualIncome,
    actualExpense,
    actualRefund,
    budgetRefund,
    pendingExpenses,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="border-cream-300 flex flex-wrap items-center gap-3 rounded-xl border bg-white px-4 py-3">
        <span className="text-brown-500 text-xs whitespace-nowrap">Copiar desde</span>
        <input
          type="month"
          value={refMonth}
          max={prevMonth(selectedMonth)}
          onChange={(e) => setRefMonth(e.target.value)}
          className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
        />
        <button
          onClick={handleCopy}
          disabled={copying || !refMonth}
          className="bg-brown-800 hover:bg-brown-700 cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
        >
          {copying ? "Copiando..." : "Copiar"}
        </button>
        <a
          href={`/api/finance/budget/export?month=${selectedMonth}`}
          className="border-brown-800 text-brown-800 hover:bg-brown-800 cursor-pointer rounded-lg border px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:text-white"
        >
          Exportar a Excel
        </a>
      </div>

      <div className="border-brown-300 overflow-hidden rounded-xl border bg-white">
        <div className="border-cream-200 border-b px-4 py-3">
          <span className="text-brown-800 text-sm font-semibold">Balance</span>
        </div>
        <div className="grid grid-cols-4 gap-3 p-4">
          <SummaryCard label="Ingresos" budget={budgetIncome} actual={actualIncome} />
          <SummaryCard
            label="Gastos"
            budget={budgetExpense}
            actual={actualExpense}
            pendingAmount={pendingAmount}
          />
          <SummaryCard
            label="Neto"
            budget={budgetIncome - budgetExpense}
            actual={actualNet}
            disponible={available}
            ahorroPotencial={potentialSavings}
          />
          <SummaryCard label="Devoluciones" budget={budgetRefund} actual={actualRefund} />
        </div>
      </div>

      <BudgetTableView
        incomeGroups={incomeGroups}
        expenseGroups={expenseGroups}
        refundGroups={refundGroups}
        budget={budget}
        actual={actual}
        inputKey={inputKey}
        onBlur={handleBlur}
        onOpenTransaction={onOpenTransaction}
        closedCategories={closedCategories}
        onToggleClose={handleToggleClose}
      />
      <BudgetCardsView
        incomeGroups={incomeGroups}
        expenseGroups={expenseGroups}
        refundGroups={refundGroups}
        budget={budget}
        actual={actual}
        inputKey={inputKey}
        onBlur={handleBlur}
        onOpenTransaction={onOpenTransaction}
        closedCategories={closedCategories}
        onToggleClose={handleToggleClose}
      />
    </div>
  );
}

interface ResponsiveViewProps {
  incomeGroups: Group[];
  expenseGroups: Group[];
  refundGroups: Group[];
  budget: Record<string, number>;
  actual: Record<string, number>;
  inputKey: number;
  onBlur: (category: string, value: string) => void;
  onOpenTransaction: (category: string) => void;
  closedCategories: string[];
  onToggleClose: (category: string) => void;
}

/** Desktop dense table layout. Markup is unchanged from the pre-split BudgetTab — only wrapped and hidden below `sm`. */
function BudgetTableView({
  incomeGroups,
  expenseGroups,
  refundGroups,
  budget,
  actual,
  inputKey,
  onBlur,
  onOpenTransaction,
  closedCategories,
  onToggleClose,
}: ResponsiveViewProps) {
  return (
    <div data-testid="budget-table" className="hidden flex-col gap-6 sm:flex">
      <GroupSection
        title="Ingresos"
        groups={incomeGroups}
        budget={budget}
        actual={actual}
        isIncome
        inputKey={inputKey}
        onBlur={onBlur}
        onOpenTransaction={onOpenTransaction}
      />
      <GroupSection
        title="Gastos"
        groups={expenseGroups}
        budget={budget}
        actual={actual}
        isIncome={false}
        inputKey={inputKey}
        onBlur={onBlur}
        onOpenTransaction={onOpenTransaction}
        closedCategories={closedCategories}
        onToggleClose={onToggleClose}
      />
      <GroupSection
        title="Devoluciones"
        groups={refundGroups}
        budget={budget}
        actual={actual}
        isIncome={true}
        inputKey={inputKey}
        onBlur={onBlur}
        onOpenTransaction={onOpenTransaction}
      />
    </div>
  );
}

/** Mobile stacked-card layout for the same category data. Visible below `sm`, hidden at `sm` and up. */
function BudgetCardsView({
  incomeGroups,
  expenseGroups,
  refundGroups,
  budget,
  actual,
  inputKey,
  onBlur,
  onOpenTransaction,
  closedCategories,
  onToggleClose,
}: ResponsiveViewProps) {
  return (
    <div data-testid="budget-cards" className="flex flex-col gap-6 sm:hidden">
      <CardsSection
        title="Ingresos"
        groups={incomeGroups}
        budget={budget}
        actual={actual}
        isIncome
        inputKey={inputKey}
        onBlur={onBlur}
        onOpenTransaction={onOpenTransaction}
      />
      <CardsSection
        title="Gastos"
        groups={expenseGroups}
        budget={budget}
        actual={actual}
        isIncome={false}
        inputKey={inputKey}
        onBlur={onBlur}
        onOpenTransaction={onOpenTransaction}
        closedCategories={closedCategories}
        onToggleClose={onToggleClose}
      />
      <CardsSection
        title="Devoluciones"
        groups={refundGroups}
        budget={budget}
        actual={actual}
        isIncome={true}
        inputKey={inputKey}
        onBlur={onBlur}
        onOpenTransaction={onOpenTransaction}
      />
    </div>
  );
}

export function SummaryCard({
  label,
  budget,
  actual,
  pendingAmount,
  disponible,
  ahorroPotencial,
}: {
  label: string;
  budget: number;
  actual: number;
  pendingAmount?: number;
  disponible?: number;
  ahorroPotencial?: number;
}) {
  return (
    <div className="border-cream-200 flex min-h-[6rem] flex-col gap-1 rounded-lg border p-3 text-center">
      <span className="text-2xs text-brown-400 font-semibold tracking-wide uppercase">{label}</span>
      <span className="text-brown-500 text-xs">Presup. {formatCLP(budget)}</span>
      <span className="text-brown-900 text-sm font-bold">Real {formatCLP(actual)}</span>
      {pendingAmount !== undefined && (
        <span
          className={`text-xs font-semibold ${pendingAmount < 0 ? "text-red-500" : "text-brown-400"}`}
        >
          {pendingAmount < 0
            ? `Excedido ${formatCLP(Math.abs(pendingAmount))}`
            : `Pendiente ${formatCLP(pendingAmount)}`}
        </span>
      )}
      {disponible !== undefined && (
        <span
          className={`text-xs font-semibold ${disponible < 0 ? "text-red-500" : "text-green-600"}`}
        >
          {disponible < 0
            ? `Faltante ${formatCLP(Math.abs(disponible))}`
            : `Disponible ${formatCLP(disponible)}`}
        </span>
      )}
      {ahorroPotencial !== undefined && (
        <span
          className={`text-xs font-semibold ${ahorroPotencial < 0 ? "text-red-500" : "text-green-600"}`}
        >
          Ahorro potencial {formatCLP(Math.abs(ahorroPotencial))}
        </span>
      )}
    </div>
  );
}

function GroupSection({
  title,
  groups,
  budget,
  actual,
  isIncome,
  inputKey,
  onBlur,
  onOpenTransaction,
  closedCategories = [],
  onToggleClose,
}: {
  title: string;
  groups: Group[];
  budget: Record<string, number>;
  actual: Record<string, number>;
  isIncome: boolean;
  inputKey: number;
  onBlur: (category: string, value: string) => void;
  onOpenTransaction: (category: string) => void;
  closedCategories?: string[];
  onToggleClose?: (category: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-brown-400 text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {groups.map((g) => {
        const totalBudget = g.categories.reduce((s, c) => s + (budget[c] ?? 0), 0);
        const totalActual = g.categories.reduce((s, c) => s + (actual[c] ?? 0), 0);
        const totalDiff = isIncome ? totalActual - totalBudget : totalBudget - totalActual;

        return (
          <div key={g.name} className="border-cream-300 overflow-hidden rounded-xl border bg-white">
            <div className="border-cream-200 border-b px-4 py-3">
              <span className="text-brown-800 text-sm font-semibold">{g.name}</span>
            </div>

            <div className="text-2xs text-brown-400 grid grid-cols-4 gap-2 px-4 py-2 font-semibold tracking-wide uppercase">
              <span>Categoría</span>
              <span className="text-right">Presupuesto</span>
              <span className="text-right">Real</span>
              <span className="text-right">Diferencia</span>
            </div>

            {[...g.categories]
              .sort((a, b) => a.localeCompare(b, "es"))
              .map((cat) => {
                const planned = budget[cat] ?? 0;
                const real = actual[cat] ?? 0;
                const diff = isIncome ? real - planned : planned - real;
                const isClosed = !isIncome && closedCategories.includes(cat);
                return (
                  <div
                    key={cat}
                    aria-disabled={isIncome ? undefined : isClosed}
                    className={`border-cream-100 grid grid-cols-4 items-center gap-2 border-t px-4 py-2 ${isClosed ? "opacity-50" : ""}`}
                  >
                    <span className={`text-brown-700 text-sm ${isClosed ? "line-through" : ""}`}>
                      {cat}
                    </span>
                    <div className="flex justify-end">
                      <input
                        type="number"
                        min="0"
                        key={`${inputKey}-b-${cat}`}
                        defaultValue={planned || ""}
                        placeholder="0"
                        disabled={isClosed}
                        onBlur={(e) => onBlur(cat, e.target.value)}
                        className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 w-24 rounded-lg border px-2 py-1 text-right text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-brown-900 text-sm">
                        {real > 0 ? formatCLP(real) : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenTransaction(cat)}
                        className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 cursor-pointer rounded-md border px-1.5 py-0.5 text-xs transition-colors"
                        aria-label={`Agregar transacción para ${cat}`}
                      >
                        +
                      </button>
                      {!isIncome && onToggleClose && (
                        <button
                          type="button"
                          onClick={() => onToggleClose(cat)}
                          aria-pressed={isClosed}
                          className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 cursor-pointer rounded-md border px-1.5 py-0.5 text-xs transition-colors"
                          aria-label={isClosed ? `Reabrir ${cat}` : `Cerrar ${cat}`}
                        >
                          {isClosed ? "Abrir" : "Cerrar"}
                        </button>
                      )}
                    </div>
                    <span
                      className={`text-right text-sm font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-brown-400"}`}
                    >
                      {diff !== 0 ? `${diff > 0 ? "+" : ""}${formatCLP(diff)}` : "—"}
                    </span>
                  </div>
                );
              })}

            <div className="border-cream-300 bg-cream-50 grid grid-cols-4 items-center gap-2 border-t px-4 py-3">
              <span className="text-2xs text-brown-500 font-semibold tracking-wide uppercase">
                Total {g.name}
              </span>
              <span className="text-brown-900 text-right text-sm font-bold">
                {formatCLP(totalBudget)}
              </span>
              <span className="text-brown-900 text-right text-sm font-bold">
                {formatCLP(totalActual)}
              </span>
              <span
                className={`text-right text-sm font-bold ${totalDiff > 0 ? "text-green-600" : totalDiff < 0 ? "text-red-500" : "text-brown-400"}`}
              >
                {totalDiff !== 0 ? `${totalDiff > 0 ? "+" : ""}${formatCLP(totalDiff)}` : "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Mobile equivalent of `GroupSection`: same category data, rendered as stacked
 * cards (label/value pairs) instead of a `grid-cols-4` row, so currency values
 * never clip or wrap on narrow viewports. Action buttons meet the 44x44px
 * minimum tap target per the Responsive Convention.
 */
function CardsSection({
  title,
  groups,
  budget,
  actual,
  isIncome,
  inputKey,
  onBlur,
  onOpenTransaction,
  closedCategories = [],
  onToggleClose,
}: {
  title: string;
  groups: Group[];
  budget: Record<string, number>;
  actual: Record<string, number>;
  isIncome: boolean;
  inputKey: number;
  onBlur: (category: string, value: string) => void;
  onOpenTransaction: (category: string) => void;
  closedCategories?: string[];
  onToggleClose?: (category: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-brown-400 text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {groups.map((g) => {
        const totalBudget = g.categories.reduce((s, c) => s + (budget[c] ?? 0), 0);
        const totalActual = g.categories.reduce((s, c) => s + (actual[c] ?? 0), 0);
        const totalDiff = isIncome ? totalActual - totalBudget : totalBudget - totalActual;

        return (
          <div key={g.name} className="border-cream-300 overflow-hidden rounded-xl border bg-white">
            <div className="border-cream-200 border-b px-4 py-3">
              <span className="text-brown-800 text-sm font-semibold">{g.name}</span>
            </div>

            <div className="flex flex-col gap-3 p-4">
              {[...g.categories]
                .sort((a, b) => a.localeCompare(b, "es"))
                .map((cat) => {
                  const planned = budget[cat] ?? 0;
                  const real = actual[cat] ?? 0;
                  const diff = isIncome ? real - planned : planned - real;
                  const isClosed = !isIncome && closedCategories.includes(cat);
                  return (
                    <div
                      key={cat}
                      aria-disabled={isIncome ? undefined : isClosed}
                      className={`border-cream-100 flex flex-col gap-2 rounded-lg border p-3 ${isClosed ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-brown-700 text-sm font-semibold ${isClosed ? "line-through" : ""}`}
                        >
                          {cat}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenTransaction(cat)}
                            className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 min-h-11 min-w-11 inline-flex cursor-pointer items-center justify-center rounded-md border text-xs transition-colors"
                            aria-label={`Agregar transacción para ${cat}`}
                          >
                            +
                          </button>
                          {!isIncome && onToggleClose && (
                            <button
                              type="button"
                              onClick={() => onToggleClose(cat)}
                              aria-pressed={isClosed}
                              className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 min-h-11 min-w-11 inline-flex cursor-pointer items-center justify-center rounded-md border text-xs transition-colors"
                              aria-label={isClosed ? `Reabrir ${cat}` : `Cerrar ${cat}`}
                            >
                              {isClosed ? "Abrir" : "Cerrar"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-brown-500">Presupuesto</span>
                        <input
                          type="number"
                          min="0"
                          key={`${inputKey}-b-${cat}`}
                          defaultValue={planned || ""}
                          placeholder="0"
                          disabled={isClosed}
                          onBlur={(e) => onBlur(cat, e.target.value)}
                          className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 w-24 rounded-lg border px-2 py-1 text-right text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-brown-500">Real</span>
                        <span className="text-brown-900 font-semibold">
                          {real > 0 ? formatCLP(real) : "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-brown-500">Diferencia</span>
                        <span
                          className={`font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-brown-400"}`}
                        >
                          {diff !== 0 ? `${diff > 0 ? "+" : ""}${formatCLP(diff)}` : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="border-cream-300 bg-cream-50 flex items-center justify-between gap-2 border-t px-4 py-3">
              <span className="text-2xs text-brown-500 font-semibold tracking-wide uppercase">
                Total {g.name}
              </span>
              <div className="flex items-center gap-3 text-right text-sm font-bold">
                <span className="text-brown-900">{formatCLP(totalBudget)}</span>
                <span className="text-brown-900">{formatCLP(totalActual)}</span>
                <span
                  className={totalDiff > 0 ? "text-green-600" : totalDiff < 0 ? "text-red-500" : "text-brown-400"}
                >
                  {totalDiff !== 0 ? `${totalDiff > 0 ? "+" : ""}${formatCLP(totalDiff)}` : "—"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
