import { ProgressBar } from "@/shared/components/ProgressBar/ProgressBar";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

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
  function formatCompletionMonth(monthKey: string): string {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
  }

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
            <span className="capitalize">{formatCompletionMonth(estimatedCompletionMonth!)}</span>
            {" · "}
            <span className="text-brown-400">en {monthsToCompletion} meses</span>
          </span>
        )}
      </div>
      <ProgressBar value={progress} />
      <span className="text-xs text-brown-400">
        {fmt(currentAmount)} / {fmt(targetAmount)}
      </span>
    </div>
  );
}
