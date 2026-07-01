"use client";

import type { FinanceTransaction } from "@/features/finance/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  transaction: FinanceTransaction;
  groupName?: string;
  showCategory?: boolean;
  onDelete: (id: string) => void;
}

export function TransactionCard({ transaction, groupName, showCategory = false, onDelete }: Props) {
  return (
    <li className="border-cream-200 flex items-center justify-between rounded-lg border bg-white px-3 py-2">
      <div className="flex flex-col">
        <span className="text-brown-700 text-sm">{formatCLP(transaction.amount)}</span>
        {showCategory && (
          <span className="text-2xs text-brown-600 font-medium">{transaction.category}</span>
        )}
        {groupName && <span className="text-2xs text-brown-400">{groupName}</span>}
        {transaction.note && (
          <span data-testid="tx-note" className="text-2xs text-brown-400">
            {transaction.note}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(transaction.id)}
        className="text-brown-400 cursor-pointer text-xs transition-colors hover:text-red-500"
        aria-label="Eliminar transacción"
      >
        ✕
      </button>
    </li>
  );
}
