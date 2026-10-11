"use client";

import { useState } from "react";
import type { IncomeComparison, IncomeSource } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { Button, Input } from "@/shared/components";
import type { BudgetMode } from "./budgetMode";
import { InlineNameField } from "./InlineNameField";
import { LoadingSpend } from "./SpendPairing";

interface Props {
  mode: BudgetMode;
  /** The viewed month's budgeted sources (edit mode lists these). */
  sources: IncomeSource[];
  /** `null` while the viewed month's transactions load: a false "$0" of real income is
   *  worse than no number (same rule as `LoadingSpend`). */
  income: IncomeComparison | null;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onAmountBlur: (id: string, raw: string) => void;
  onDelete: (id: string) => void;
}

// The real figure leads, followed by the budget it is measured against and what is
// missing or exceeded, so the reader never has to subtract. A shortfall is not shown
// as an alarm: mid-month, income often just has not arrived yet.
function IncomeFigures({ real, budgeted }: { real: number; budgeted: number }) {
  const difference = real - budgeted;
  const suffix =
    difference < 0
      ? ` · faltan ${formatCLP(-difference)}`
      : difference > 0
        ? ` · superado en ${formatCLP(difference)}`
        : "";
  return (
    <span className="flex shrink-0 flex-col items-end">
      <span
        className={`font-figure text-sm font-bold ${difference >= 0 ? "text-green-700" : "text-ink-800"}`}
      >
        {formatCLP(real)}
      </span>
      <span className="font-figure text-2xs text-ink-400">{`de ${formatCLP(budgeted)}${suffix}`}</span>
    </span>
  );
}

function ViewRows({ sources, income }: Pick<Props, "sources" | "income">) {
  if (sources.length === 0 && (income === null || income.unassigned === 0)) {
    return <p className="text-ink-500 text-sm">No hay fuentes de ingreso</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {sources.map((source) => {
        const row = income?.rows.find((r) => r.id === source.id);
        return (
          <li key={source.id} className="flex items-center justify-between gap-2">
            <span className="text-ink-600 min-w-0 truncate">{source.name}</span>
            {row ? <IncomeFigures real={row.real} budgeted={row.budgeted} /> : <LoadingSpend />}
          </li>
        );
      })}
      {income !== null && income.unassigned > 0 && (
        <li className="flex items-center justify-between gap-2">
          <span className="text-ink-600">Sin fuente</span>
          <span className="font-figure text-ink-800 shrink-0 text-sm font-bold">
            {formatCLP(income.unassigned)}
          </span>
        </li>
      )}
      <li className="border-surface-300 flex items-center justify-between gap-2 border-t-2 border-dashed pt-3">
        <span className="text-ink-800">Total</span>
        {income ? (
          <IncomeFigures real={income.total.real} budgeted={income.total.budgeted} />
        ) : (
          <LoadingSpend />
        )}
      </li>
    </ul>
  );
}

// Presentational only — the sources live in the versioned budget (`useFinanceV2Budget`),
// so an edit here applies from the viewed month on, like a category edit. Same card as
// `AccountCoverage`; view mode compares, edit mode only manages the sources.
export function IncomeBudget({
  mode,
  sources,
  income,
  onAdd,
  onRename,
  onAmountBlur,
  onDelete,
}: Props) {
  const [name, setName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name);
    setName("");
  };

  return (
    <section className="border-surface-300 bg-surface-100 flex flex-col gap-3 rounded-3xl border-2 p-5">
      <h3 className="text-ink-900 text-2xl">Ingresos</h3>

      {mode === "view" ? (
        <ViewRows sources={sources} income={income} />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {sources.map((source) => (
              <li key={source.id} className="flex items-center gap-2">
                <div className="flex min-w-0 flex-1">
                  <InlineNameField
                    savedName={source.name}
                    onCommit={(next) => onRename(source.id, next)}
                    className="text-ink-700"
                    inputClassName="text-ink-700 w-full"
                  />
                </div>
                {/* Fixed-width wrapper, as in `BudgetCategoryCard`: the shared `Input` is
                    `w-full`, so placed bare in this row it took the whole width and
                    squeezed the name to nothing. */}
                <div className="w-32 shrink-0">
                  <Input
                    // Re-keyed on the amount so a value saved elsewhere (another month's
                    // version, a reload) never leaves a stale uncontrolled figure behind.
                    key={`${source.id}-${source.amount}`}
                    type="number"
                    min="0"
                    aria-label={`Monto de ${source.name}`}
                    defaultValue={source.amount || ""}
                    placeholder="0"
                    autoComplete="off"
                    className="text-right"
                    onBlur={(e) => onAmountBlur(source.id, e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(source.id)}
                  aria-label={`Eliminar fuente ${source.name}`}
                  className="border-surface-300 text-ink-500 hover:border-ink-600 hover:text-ink-800 cursor-pointer rounded-full border-2 px-2 py-0.5 text-xs transition-colors"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Input
              aria-label="Nombre de la fuente"
              value={name}
              placeholder="Nueva fuente"
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" variant="primary">
              Agregar fuente
            </Button>
          </form>
        </>
      )}
    </section>
  );
}
