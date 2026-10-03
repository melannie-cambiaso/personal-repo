"use client";

import type {
  BudgetCategory,
  DayGroup,
  ExpenseCategoryOption,
  TransactionTotals,
} from "@/features/finance-v2/domain";
import type { NewTransactionInput } from "../../hooks/useFinanceV2Transactions";
import type { EnvelopeConfigInput } from "../../hooks/useFinanceV2Envelope";
import { Button } from "@/shared/components";
import { formatMonth } from "@/shared/utils/formatMonth";
import { AddTransactionModal } from "./AddTransactionModal";
import { MovementSummary } from "./MovementSummary";
import { TransactionList } from "./TransactionList";
import { EnvelopeCard } from "./Envelope/EnvelopeCard";
import { EnvelopeConfigModal } from "./Envelope/EnvelopeConfigModal";
import { EnvelopeReminder } from "./Envelope/EnvelopeReminder";
import type { EnvelopeView } from "./Envelope/envelopeView";

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
  /** `null` = no envelope configured (see `toEnvelopeView`). */
  envelope: EnvelopeView | null;
  /** Top-level budget categories the envelope can bind to. */
  budgetCategories: BudgetCategory[];
  onSaveEnvelopeConfig: (input: EnvelopeConfigInput) => void;
  /** Hoisted like `isAddOpen`: `MonthNav` must be disabled while it is open, because
   *  creating the envelope stamps `openingMonth` from `viewedMonth`. */
  isEnvelopeConfigOpen: boolean;
  onOpenEnvelopeConfig: () => void;
  onCloseEnvelopeConfig: () => void;
}

// Pure composition (math-free), consuming `useFinanceV2Transactions`'s hoisted state via
// props — same hoisting rationale as `BudgetTab` (design decision #1):
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
  envelope,
  budgetCategories,
  onSaveEnvelopeConfig,
  isEnvelopeConfigOpen,
  onOpenEnvelopeConfig,
  onCloseEnvelopeConfig,
}: Props) {
  const hasEnvelope = envelope !== null;

  return (
    <div className="flex flex-col gap-6">
      {lastCrossMonthSave && (
        <div
          role="status"
          className="border-sage-300 bg-sage-100 text-sage-800 flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-2"
        >
          <span>Guardado en {formatMonth(lastCrossMonthSave)}</span>
          <button
            type="button"
            onClick={onDismissCrossMonthSave}
            className="text-sage-800/70 hover:text-sage-800 cursor-pointer transition-colors"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}
      {envelope && <EnvelopeReminder view={envelope} />}
      <MovementSummary totals={totals} hasEnvelope={hasEnvelope} />
      {envelope ? (
        <EnvelopeCard view={envelope} onEdit={onOpenEnvelopeConfig} />
      ) : (
        <Button type="button" variant="secondary" onPress={onOpenEnvelopeConfig}>
          Configurar cuenta separada
        </Button>
      )}
      <Button type="button" variant="primary" onPress={onOpenAdd}>
        Nuevo movimiento
      </Button>
      <AddTransactionModal
        isOpen={isAddOpen}
        viewedMonth={viewedMonth}
        categoryOptions={categoryOptions}
        hasEnvelope={hasEnvelope}
        onClose={onCloseAdd}
        onAdd={onAdd}
      />
      <EnvelopeConfigModal
        isOpen={isEnvelopeConfigOpen}
        config={envelope?.config ?? null}
        categories={budgetCategories}
        onClose={onCloseEnvelopeConfig}
        onSave={onSaveEnvelopeConfig}
      />
      <TransactionList
        dayGroups={dayGroups}
        onDelete={onDelete}
        envelopeName={envelope?.config.name ?? null}
      />
    </div>
  );
}
