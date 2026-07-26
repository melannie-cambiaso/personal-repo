"use client";

import { useState } from "react";
import type { DayGroup, ExpenseCategoryOption, TransactionTotals } from "@/features/finance-v2/domain";
import type { NewTransactionInput } from "../../hooks/useFinanceV2Transactions";
import { Button } from "@/shared/components";
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
}

// Pure composition (math-free), consuming `useFinanceV2Transactions`'s hoisted state via
// props — same hoisting rationale as `BudgetTab`/`IncomeSplitTab` (design decision #1):
// tabs are conditionally rendered, so this tab must not own any of its own domain state.
// The add-transaction form lives in a modal (not inline) so the movement list stays the
// main use of screen space.
export function TransactionsTab({
  viewedMonth,
  totals,
  dayGroups,
  categoryOptions,
  onAdd,
  onDelete,
}: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <MovementSummary totals={totals} />
      <Button type="button" variant="primary" onPress={() => setIsFormOpen(true)}>
        Nuevo movimiento
      </Button>
      <AddTransactionModal
        isOpen={isFormOpen}
        viewedMonth={viewedMonth}
        categoryOptions={categoryOptions}
        onClose={() => setIsFormOpen(false)}
        onAdd={onAdd}
      />
      <TransactionList dayGroups={dayGroups} onDelete={onDelete} />
    </div>
  );
}
