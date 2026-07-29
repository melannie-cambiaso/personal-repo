import type { BucketKey, BudgetComparison as BudgetComparisonResult, BucketSpendRow } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { BUCKET_LABELS, TOTAL_LABEL } from "../bucketLabels";
import type { SpendView } from "./spendView";
import { SpendPairing, LoadingSpend } from "./SpendPairing";

interface Props {
  comparison: BudgetComparisonResult;
  spend: SpendView;
}

// `buckets` is always exactly the 3 `BUCKET_ORDER` rows (see `computeSpendComparison`),
// so a miss here means the totality invariant broke — fail loudly rather than silently
// under-render (mirrors `resolveUnassignedBucket`'s convention in `spendRollup.ts`).
function findBucketSpend(buckets: BucketSpendRow[], key: BucketKey): BucketSpendRow {
  const row = buckets.find((b) => b.key === key);
  if (!row) throw new Error(`BucketComparison: no spend row found for bucket "${key}".`);
  return row;
}

// Bucket rows show each bucket's share of the total budgeted amount inline in the
// label (design D3/D4): "Fijos (50%)", computed in the domain layer alongside the
// aggregate it derives from. The actual-spend column (design D8) is additive: a
// second line beneath the budgeted figure, driven entirely by `spend`.
export function BucketComparison({ comparison, spend }: Props) {
  return (
    <div className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4">
      {comparison.rows.map((row) => {
        const bucketSpend = spend.status === "ready" ? findBucketSpend(spend.comparison.buckets, row.key) : null;
        return (
          <div key={row.key} className="flex items-center justify-between gap-2">
            <span className="text-brown-500 text-sm">
              {BUCKET_LABELS[row.key]} ({row.sharePct}%)
            </span>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-brown-800 text-sm font-bold">{formatCLP(row.budgeted)}</span>
              {bucketSpend ? (
                <>
                  <SpendPairing row={bucketSpend} />
                  {bucketSpend.unassigned > 0 && (
                    <span className="text-2xs text-brown-400">sin categoría: {formatCLP(bucketSpend.unassigned)}</span>
                  )}
                </>
              ) : (
                <LoadingSpend />
              )}
            </div>
          </div>
        );
      })}
      <div className="border-cream-300 flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-brown-500 text-sm">{TOTAL_LABEL}</span>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-brown-800 text-sm font-bold">{formatCLP(comparison.total.budgeted)}</span>
          {spend.status === "ready" ? (
            <>
              <SpendPairing row={spend.comparison.total} />
              {spend.comparison.total.unassigned > 0 && (
                <span className="text-2xs text-brown-400">
                  sin categoría: {formatCLP(spend.comparison.total.unassigned)}
                </span>
              )}
            </>
          ) : (
            <LoadingSpend />
          )}
        </div>
      </div>
    </div>
  );
}
