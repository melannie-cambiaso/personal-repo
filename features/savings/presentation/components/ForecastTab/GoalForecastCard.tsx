import { ProgressBar } from "@/shared/components/ProgressBar/ProgressBar";
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
    <div className="flex flex-col gap-2 rounded-lg border border-cream-300 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brown-900">{name}</span>
        {monthsToCompletion === 0 ? (
          <span className="text-sm font-semibold text-green-600">Meta alcanzada ✓</span>
        ) : monthsToCompletion === null ? (
          <span className="text-sm text-brown-400">{outsideWindowLabel}</span>
        ) : (
          <span className="text-sm text-brown-700">
            <span className="capitalize">{formatMonth(estimatedCompletionMonth!)}</span>
            {" · "}
            <span className="text-brown-400">en {monthsToCompletion} meses</span>
          </span>
        )}
      </div>
      <ProgressBar value={progress} />
      <span className="text-xs text-brown-400">
        {formatCLP(currentAmount)} / {formatCLP(targetAmount)}
      </span>
    </div>
  );
}
