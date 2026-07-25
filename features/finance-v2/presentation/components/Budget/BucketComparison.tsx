import type { BudgetComparison as BudgetComparisonResult } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { BUCKET_LABELS, TOTAL_LABEL } from "../bucketLabels";

interface Props {
  comparison: BudgetComparisonResult;
}

// Renders the `BudgetComparison` union: `with-targets` shows the budgeted sum next to
// tab 1's target; `budget-only` shows ONLY the budgeted sum — the type gives us no
// `target` field to render, so a stale/fabricated target is unrepresentable here
// (design decision #3, mirrors SplitSummary's valid/invalid split).
export function BucketComparison({ comparison }: Props) {
  const withTargets = comparison.status === "with-targets";

  return (
    <div className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4">
      {comparison.rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-2">
          <span className="text-brown-500 text-sm">{BUCKET_LABELS[row.key]}</span>
          <span className="text-brown-900 text-sm font-bold">
            {formatCLP(row.budgeted)}
            {withTargets && "target" in row && (
              <span className="text-2xs text-brown-400 ml-1 font-normal">
                de {formatCLP(row.target)}
              </span>
            )}
          </span>
        </div>
      ))}
      <div className="border-cream-300 flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-brown-500 text-sm">{TOTAL_LABEL}</span>
        <span className="text-brown-900 text-sm font-bold">
          {formatCLP(comparison.total.budgeted)}
          {withTargets && "target" in comparison.total && (
            <span className="text-2xs text-brown-400 ml-1 font-normal">
              de {formatCLP(comparison.total.target)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
