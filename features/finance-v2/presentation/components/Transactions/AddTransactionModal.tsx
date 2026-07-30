"use client";

import type { ExpenseCategoryOption, TransactionCategoryRef } from "@/features/finance-v2/domain";
import type { NewTransactionInput } from "../../hooks/useFinanceV2Transactions";
import { ModalShell } from "@/shared/components";
import { TransactionForm } from "./TransactionForm";

interface Props {
  isOpen: boolean;
  viewedMonth: string;
  categoryOptions: ExpenseCategoryOption[];
  savingsCategoryOptions: TransactionCategoryRef[];
  onClose: () => void;
  onAdd: (input: NewTransactionInput) => void;
}

export function AddTransactionModal({
  isOpen,
  viewedMonth,
  categoryOptions,
  savingsCategoryOptions,
  onClose,
  onAdd,
}: Props) {
  const handleAdd = (input: NewTransactionInput) => {
    onAdd(input);
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Registrar movimiento">
      {/* key forces a remount on month change since this dialog never unmounts, reseeding TransactionForm's local month state */}
      <TransactionForm
        key={viewedMonth}
        viewedMonth={viewedMonth}
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={handleAdd}
      />
    </ModalShell>
  );
}
