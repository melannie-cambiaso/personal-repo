import type { SplitResult } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { BUCKET_LABELS } from "../bucketLabels";

interface Props {
  split: SplitResult;
}

// Sole owner of the valid/invalid branch (design decision #1): when invalid, the
// type gives us no `buckets` to render, so stale amounts are unrepresentable here —
// only the validation error is shown. No progress bar / visual proportion (decision #11).
export function SplitSummary({ split }: Props) {
  if (split.status === "invalid") {
    return (
      <div className="border-cream-300 rounded-xl border bg-white p-4">
        <p className="text-sm font-semibold text-red-500">
          Las porcentajes deben sumar 100% (actual: {split.totalPercentage}%)
        </p>
      </div>
    );
  }

  return (
    <div className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4">
      {split.buckets.map((bucket) => (
        <div key={bucket.key} className="flex items-center justify-between gap-2">
          <span className="text-brown-500 flex items-baseline gap-1 text-sm">
            <span>{BUCKET_LABELS[bucket.key]}</span>
            <span className="text-2xs text-brown-400">({bucket.percentage}%)</span>
          </span>
          <span className="text-brown-800 text-sm font-bold">{formatCLP(bucket.amount)}</span>
        </div>
      ))}
    </div>
  );
}
