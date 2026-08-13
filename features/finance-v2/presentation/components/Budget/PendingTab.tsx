"use client";

import { formatCLP } from "@/shared/utils/formatCurrency";
import { BUDGET_MODE_LABEL, type BudgetMode } from "./budgetMode";
import type { PendingTabView } from "./pendingTabView";
import { PendingLeafRow } from "./PendingLeafRow";

interface Props {
  mode: BudgetMode;
  onToggleMode: () => void;
  view: PendingTabView;
  onOverrideBlur: (leafId: string, raw: string) => void;
}

// Reuses `BudgetTab`'s mode toggle + `BudgetMode`/`BUDGET_MODE_LABEL` (design D7). The
// total row renders ABOVE the leaf list (design file plan) and is derived entirely from
// `view.view.total` — never independently computed here. Rows never include a
// savings-bucket leaf: `view.view.rows` already excludes them structurally
// (`computePendingView` walks `listExpenseCategoryOptions`, see design D1).
export function PendingTab({ mode, onToggleMode, view, onOverrideBlur }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          type="button"
          aria-pressed={mode === "edit"}
          onClick={onToggleMode}
          className="bg-cream-100 text-brown-600 hover:bg-cream-200 cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          {BUDGET_MODE_LABEL[mode]}
        </button>
      </div>

      {view.status === "loading" ? (
        <p className="text-brown-500 text-sm">Cargando…</p>
      ) : (
        <>
          <div className="border-cream-300 flex items-center justify-between gap-2 rounded-xl border bg-white p-4">
            <span className="text-brown-500 text-sm">Total pendiente</span>
            <span className="text-brown-800 text-sm font-bold">{formatCLP(view.view.total)}</span>
          </div>

          {view.view.rows.length === 0 ? (
            <p className="text-brown-500 text-sm">No hay categorías cargadas</p>
          ) : (
            <div className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4">
              {view.view.rows.map((row) => (
                <PendingLeafRow key={row.id} mode={mode} row={row} onOverrideBlur={onOverrideBlur} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
