"use client";

import type { DayGroup, ExpenseCategoryOption, TransactionTotals } from "@/features/finance-v2/domain";
import type { NewTransactionInput } from "../../hooks/useFinanceV2Transactions";
import { MovementSummary } from "./MovementSummary";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";

interface Props {
  month: string;
  totals: TransactionTotals;
  dayGroups: DayGroup[];
  categoryOptions: ExpenseCategoryOption[];
  onAdd: (input: NewTransactionInput) => void;
  onDelete: (id: string) => void;
}

// Pure composition (math-free), consuming `useFinanceV2Transactions`'s hoisted state via
// props — same hoisting rationale as `BudgetTab`/`IncomeSplitTab` (design decision #1):
// tabs are conditionally rendered, so this tab must not own any of its own domain state.
export function TransactionsTab({
  month,
  totals,
  dayGroups,
  categoryOptions,
  onAdd,
  onDelete,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <MovementSummary totals={totals} />
      <TransactionForm month={month} categoryOptions={categoryOptions} onAdd={onAdd} />
      <TransactionList dayGroups={dayGroups} onDelete={onDelete} />
    </div>
  );
}
