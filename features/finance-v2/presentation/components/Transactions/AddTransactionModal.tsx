"use client";

import type { ExpenseCategoryOption } from "@/features/finance-v2/domain";
import type { NewTransactionInput } from "../../hooks/useFinanceV2Transactions";
import { ModalShell } from "@/shared/components";
import { TransactionForm } from "./TransactionForm";

interface Props {
  isOpen: boolean;
  viewedMonth: string;
  categoryOptions: ExpenseCategoryOption[];
  onClose: () => void;
  onAdd: (input: NewTransactionInput) => void;
}

export function AddTransactionModal({ isOpen, viewedMonth, categoryOptions, onClose, onAdd }: Props) {
  const handleAdd = (input: NewTransactionInput) => {
    onAdd(input);
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Registrar movimiento">
      <TransactionForm viewedMonth={viewedMonth} categoryOptions={categoryOptions} onAdd={handleAdd} />
    </ModalShell>
  );
}
