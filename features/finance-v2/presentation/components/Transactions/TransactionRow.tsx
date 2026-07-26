import type { FinanceV2Transaction } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { BUCKET_LABELS } from "../bucketLabels";
import { TRANSACTION_TYPE_LABELS } from "./transactionLabels";

interface Props {
  transaction: FinanceV2Transaction;
  onDelete: (id: string) => void;
}

/** Passive orphan handling in action: this component receives NO live category
 *  list at all — it can only ever render `transaction.category.name`, the
 *  snapshot taken at creation time. There is structurally no way for it to
 *  perform a live lookup, so a deleted Budget-tab subcategory can never break
 *  this row (locked design decision). */
function primaryLabel(transaction: FinanceV2Transaction): string {
  if (transaction.type !== "expense") {
    return TRANSACTION_TYPE_LABELS[transaction.type];
  }
  return transaction.category ? transaction.category.name : BUCKET_LABELS[transaction.bucket];
}

export function TransactionRow({ transaction, onDelete }: Props) {
  return (
    <div className="border-cream-200 flex items-center justify-between gap-2 border-t pt-3 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-col">
        <span className="text-brown-800 truncate text-sm font-semibold">
          {primaryLabel(transaction)}
        </span>
        {transaction.note && (
          <span className="text-brown-500 truncate text-xs">{transaction.note}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-brown-800 text-sm font-bold">{formatCLP(transaction.amount)}</span>
        <button
          type="button"
          onClick={() => onDelete(transaction.id)}
          aria-label={`Eliminar movimiento de ${formatCLP(transaction.amount)}`}
          className="text-2xs text-brown-400 hover:text-red-600 cursor-pointer font-semibold transition-colors"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
