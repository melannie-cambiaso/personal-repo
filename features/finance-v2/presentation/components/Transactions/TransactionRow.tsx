import type { FinanceV2Transaction } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { BUCKET_LABELS } from "../bucketLabels";
import { TRANSACTION_TYPE_LABELS } from "./transactionLabels";

interface Props {
  transaction: FinanceV2Transaction;
  /** The configured envelope's name; `null` when none is configured. */
  envelopeName: string | null;
  /** The configured savings fund's name; `null`/absent when none is configured. */
  savingsFundName?: string | null;
  onDelete: (id: string) => void;
  onEdit: (transaction: FinanceV2Transaction) => void;
}

/** Passive orphan handling in action: this component receives NO live category
 *  list at all — it can only ever render `transaction.category.name`, the
 *  snapshot taken at creation time. There is structurally no way for it to
 *  perform a live lookup, so a deleted Budget-tab subcategory can never break
 *  this row (locked design decision). `envelopeName` does not break that rule: it
 *  is config (a display name for the single envelope), not a category snapshot. The
 *  savings fund's name follows the same rule. */
function primaryLabel(
  transaction: FinanceV2Transaction,
  envelopeName: string | null,
  savingsFundName: string | null
): string {
  if (transaction.type === "transfer") {
    return envelopeName
      ? `${TRANSACTION_TYPE_LABELS.transfer} → ${envelopeName}`
      : TRANSACTION_TYPE_LABELS.transfer;
  }
  if (transaction.type === "withdrawal") {
    return savingsFundName ? `Retiro de ${savingsFundName}` : TRANSACTION_TYPE_LABELS.withdrawal;
  }
  if (transaction.type !== "expense") {
    return TRANSACTION_TYPE_LABELS[transaction.type];
  }
  return transaction.category ? transaction.category.name : BUCKET_LABELS[transaction.bucket];
}

export function TransactionRow({
  transaction,
  envelopeName,
  savingsFundName = null,
  onDelete,
  onEdit,
}: Props) {
  return (
    <div className="border-surface-300 flex items-center justify-between gap-2 border-t border-dashed pt-3 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-col">
        <span className="text-ink-900 truncate">
          {primaryLabel(transaction, envelopeName, savingsFundName)}
        </span>
        {transaction.type === "expense" && transaction.paidFrom === "envelope" && (
          <span className="text-ink-500 truncate text-sm">
            desde {envelopeName ?? "cuenta separada"}
          </span>
        )}
        {transaction.type === "expense" && transaction.paidFrom === "savingsFund" && (
          <span className="text-ink-500 truncate text-sm">
            desde {savingsFundName ?? "ahorros"}
          </span>
        )}
        {transaction.type === "savings" && transaction.sourceCategory && (
          <span className="text-ink-500 truncate text-sm">
            de {transaction.sourceCategory.name}
          </span>
        )}
        {transaction.type === "income" && transaction.source && (
          <span className="text-ink-500 truncate text-sm">de {transaction.source.name}</span>
        )}
        {transaction.note && (
          <span className="text-ink-500 truncate text-sm">{transaction.note}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-figure text-ink-800 text-sm font-bold">
          {formatCLP(transaction.amount)}
        </span>
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          aria-label={`Editar movimiento de ${formatCLP(transaction.amount)}`}
          className="text-ink-400 hover:text-brand-600 cursor-pointer text-sm transition-colors"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(transaction.id)}
          aria-label={`Eliminar movimiento de ${formatCLP(transaction.amount)}`}
          className="text-ink-400 cursor-pointer text-sm transition-colors hover:text-red-600"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
