import { formatCLP } from "@/shared/utils/formatCurrency";
import type { AccountCoverageView } from "./accountCoverageView";
import { LoadingSpend } from "./SpendPairing";

interface Props {
  coverage: AccountCoverageView;
}

// Answers "does the main account cover the rest of the month?": what is still left
// to pay from it against the month's balance, with the difference spelled out so
// the reader does not have to subtract. Same card and label-left / figure-right
// layout as `BucketComparison`, which it sits under.
export function AccountCoverage({ coverage }: Props) {
  const { figures, envelopeNote } = coverage;
  const diff = figures ? figures.balance - figures.pending : null;

  return (
    <div className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-brown-500 text-sm">Pendiente por pagar desde la cuenta</span>
        {figures ? (
          <span className="text-brown-800 text-sm font-bold">{formatCLP(figures.pending)}</span>
        ) : (
          <LoadingSpend />
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-brown-500 text-sm">Saldo del mes</span>
        {figures ? (
          <span className="text-brown-800 text-sm font-bold">{formatCLP(figures.balance)}</span>
        ) : (
          <LoadingSpend />
        )}
      </div>
      <div className="border-cream-300 flex flex-col items-end gap-0.5 border-t pt-3">
        {diff === null ? (
          <LoadingSpend />
        ) : diff >= 0 ? (
          <span className="text-sm font-bold text-green-700">Te sobran {formatCLP(diff)}</span>
        ) : (
          <span className="text-sm font-bold text-red-600">Te faltan {formatCLP(-diff)}</span>
        )}
        {envelopeNote && (
          <span className="text-2xs text-brown-400">
            no incluye {envelopeNote.categoryName}: se paga desde {envelopeNote.envelopeName}
          </span>
        )}
      </div>
    </div>
  );
}
