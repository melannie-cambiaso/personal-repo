import type { FinanceV2Transaction } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { BUCKET_LABELS } from "../bucketLabels";
import { TRANSACTION_TYPE_LABELS } from "./transactionLabels";

interface Props {
  transaction: FinanceV2Transaction;
  /** The configured envelope's name; `null` when none is configured. */
  envelopeName: string | null;
  onDelete: (id: string) => void;
}

/** Passive orphan handling in action: this component receives NO live category
 *  list at all — it can only ever render `transaction.category.name`, the
 *  snapshot taken at creation time. There is structurally no way for it to
 *  perform a live lookup, so a deleted Budget-tab subcategory can never break
 *  this row (locked design decision). `envelopeName` does not break that rule: it
 *  is config (a display name for the single envelope), not a category snapshot. */
function primaryLabel(transaction: FinanceV2Transaction, envelopeName: string | null): string {
  if (transaction.type === "transfer") {
    return envelopeName
      ? `${TRANSACTION_TYPE_LABELS.transfer} → ${envelopeName}`
      : TRANSACTION_TYPE_LABELS.transfer;
  }
  if (transaction.type !== "expense") {
    return TRANSACTION_TYPE_LABELS[transaction.type];
  }
  return transaction.category ? transaction.category.name : BUCKET_LABELS[transaction.bucket];
}

export function TransactionRow({ transaction, envelopeName, onDelete }: Props) {
  return (
    <div className="border-sage-300 flex items-center justify-between gap-2 border-t border-dashed pt-3 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-col">
        <span className="text-brown-900 truncate">{primaryLabel(transaction, envelopeName)}</span>
        {transaction.type === "expense" && transaction.paidFrom === "envelope" && (
          <span className="text-brown-500 truncate text-sm">
            desde {envelopeName ?? "cuenta separada"}
          </span>
        )}
        {transaction.type === "savings" && transaction.sourceCategory && (
          <span className="text-brown-500 truncate text-sm">
            de {transaction.sourceCategory.name}
          </span>
        )}
        {transaction.note && (
          <span className="text-brown-500 truncate text-sm">{transaction.note}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-figure text-brown-800 text-sm font-bold">
          {formatCLP(transaction.amount)}
        </span>
        <button
          type="button"
          onClick={() => onDelete(transaction.id)}
          aria-label={`Eliminar movimiento de ${formatCLP(transaction.amount)}`}
          className="text-brown-400 cursor-pointer text-sm transition-colors hover:text-red-600"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
