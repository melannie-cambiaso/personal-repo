"use client";

import type { ExpenseCategoryOption, FinanceV2Transaction } from "@/features/finance-v2/domain";
import type { NewTransactionInput } from "../../hooks/useFinanceV2Transactions";
import { ModalShell } from "@/shared/components";
import { TransactionForm } from "./TransactionForm";

interface Props {
  isOpen: boolean;
  viewedMonth: string;
  categoryOptions: ExpenseCategoryOption[];
  hasEnvelope: boolean;
  /** Present = edit mode: the form is seeded from it and submit calls `onUpdate`. */
  editingTransaction?: FinanceV2Transaction | null;
  onClose: () => void;
  onAdd: (input: NewTransactionInput) => void;
  onUpdate?: (id: string, input: NewTransactionInput) => void;
}

export function AddTransactionModal({
  isOpen,
  viewedMonth,
  categoryOptions,
  hasEnvelope,
  editingTransaction,
  onClose,
  onAdd,
  onUpdate,
}: Props) {
  const handleSubmit = (input: NewTransactionInput) => {
    if (editingTransaction) onUpdate?.(editingTransaction.id, input);
    else onAdd(input);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onCancel={onClose}
      title={editingTransaction ? "Editar movimiento" : "Registrar movimiento"}
    >
      {/* key forces a remount on month change or edit target change since this dialog
          never unmounts, reseeding TransactionForm's local state */}
      <TransactionForm
        key={`${viewedMonth}:${editingTransaction?.id ?? "new"}`}
        viewedMonth={viewedMonth}
        categoryOptions={categoryOptions}
        hasEnvelope={hasEnvelope}
        initialTransaction={editingTransaction ?? undefined}
        onAdd={handleSubmit}
      />
    </ModalShell>
  );
}
