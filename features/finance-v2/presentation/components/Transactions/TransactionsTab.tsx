"use client";

import type { DayGroup, ExpenseCategoryOption, TransactionTotals } from "@/features/finance-v2/domain";
import type { NewTransactionInput } from "../../hooks/useFinanceV2Transactions";
import { Button } from "@/shared/components";
import { formatMonth } from "@/shared/utils/formatMonth";
import { AddTransactionModal } from "./AddTransactionModal";
import { MovementSummary } from "./MovementSummary";
import { TransactionList } from "./TransactionList";

interface Props {
  viewedMonth: string;
  totals: TransactionTotals;
  dayGroups: DayGroup[];
  categoryOptions: ExpenseCategoryOption[];
  onAdd: (input: NewTransactionInput) => void;
  onDelete: (id: string) => void;
  /** Set by the hook right after a transaction was saved to a month other than
   *  `viewedMonth`; drives the dismissible confirmation banner below. `null` = no banner. */
  lastCrossMonthSave: string | null;
  onDismissCrossMonthSave: () => void;
  isAddOpen: boolean;
  onOpenAdd: () => void;
  onCloseAdd: () => void;
}

// Pure composition (math-free), consuming `useFinanceV2Transactions`'s hoisted state via
// props — same hoisting rationale as `BudgetTab`/`IncomeSplitTab` (design decision #1):
// tabs are conditionally rendered, so this tab must not own any of its own domain state.
// `MonthNav` and the add-transaction open flag both moved up to `FinanceV2Screen` (design
// decision D6): `MonthNav` is now a single control shared with the Presupuesto tab, and
// `isAddOpen` had to move with it because `MonthNav`'s `disabled={isAddOpen}` guard is a
// real correctness guard (`AddTransactionModal` reads `viewedMonth`; letting the month
// change under an open modal would retarget the save). The add-transaction form lives in a
// modal (not inline) so the movement list stays the main use of screen space.
export function TransactionsTab({
  viewedMonth,
  totals,
  dayGroups,
  categoryOptions,
  onAdd,
  onDelete,
  lastCrossMonthSave,
  onDismissCrossMonthSave,
  isAddOpen,
  onOpenAdd,
  onCloseAdd,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      {lastCrossMonthSave && (
        <div
          role="status"
          className="border-cream-300 bg-cream-100 text-brown-800 flex items-center justify-between rounded-lg border px-4 py-2 text-sm"
        >
          <span>Guardado en {formatMonth(lastCrossMonthSave)}</span>
          <button
            type="button"
            onClick={onDismissCrossMonthSave}
            className="text-brown-400 hover:text-brown-800 cursor-pointer transition-colors"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}
      <MovementSummary totals={totals} />
      <Button type="button" variant="primary" onPress={onOpenAdd}>
        Nuevo movimiento
      </Button>
      <AddTransactionModal
        isOpen={isAddOpen}
        viewedMonth={viewedMonth}
        categoryOptions={categoryOptions}
        onClose={onCloseAdd}
        onAdd={onAdd}
      />
      <TransactionList dayGroups={dayGroups} onDelete={onDelete} />
    </div>
  );
}
