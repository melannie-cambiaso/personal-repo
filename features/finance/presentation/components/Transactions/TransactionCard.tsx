"use client";

import type { FinanceTransaction } from "@/features/finance/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  transaction: FinanceTransaction;
  groupName?: string;
  showCategory?: boolean;
  onDelete: (id: string) => void;
}

export function TransactionCard({
  transaction,
  groupName,
  showCategory = false,
  onDelete,
}: Props) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-cream-200 bg-white px-3 py-2">
      <div className="flex flex-col">
        <span className="text-sm text-brown-700">{formatCLP(transaction.amount)}</span>
        {showCategory && (
          <span className="text-2xs font-medium text-brown-600">{transaction.category}</span>
        )}
        {groupName && (
          <span className="text-2xs text-brown-400">{groupName}</span>
        )}
        {transaction.note && (
          <span data-testid="tx-note" className="text-2xs text-brown-400">
            {transaction.note}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(transaction.id)}
        className="cursor-pointer text-xs text-brown-400 transition-colors hover:text-red-500"
        aria-label="Eliminar transacción"
      >
        ✕
      </button>
    </li>
  );
}
