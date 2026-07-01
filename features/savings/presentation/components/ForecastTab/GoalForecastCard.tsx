import { ProgressBar } from "@/shared/components";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { formatMonth } from "@/shared/utils/formatMonth";

interface GoalForecastCardProps {
  name: string;
  monthsToCompletion: number | null;
  estimatedCompletionMonth: string | null;
  outsideWindowLabel: string;
  currentAmount: number;
  targetAmount: number;
  progress: number;
}

export function GoalForecastCard({
  name,
  monthsToCompletion,
  estimatedCompletionMonth,
  outsideWindowLabel,
  currentAmount,
  targetAmount,
  progress,
}: GoalForecastCardProps) {
  return (
    <div className="border-cream-300 flex flex-col gap-2 rounded-lg border bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-brown-900 text-sm font-semibold">{name}</span>
        {monthsToCompletion === 0 ? (
          <span className="text-sm font-semibold text-green-600">Meta alcanzada ✓</span>
        ) : monthsToCompletion === null ? (
          <span className="text-brown-400 text-sm">{outsideWindowLabel}</span>
        ) : (
          <span className="text-brown-700 text-sm">
            <span className="capitalize">{formatMonth(estimatedCompletionMonth!)}</span>
            {" · "}
            <span className="text-brown-400">en {monthsToCompletion} meses</span>
          </span>
        )}
      </div>
      <ProgressBar value={progress} />
      <span className="text-brown-400 text-xs">
        {formatCLP(currentAmount)} / {formatCLP(targetAmount)}
      </span>
    </div>
  );
}
