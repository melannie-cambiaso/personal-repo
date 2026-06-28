interface GoalForecastCardProps {
  name: string;
  monthsToCompletion: number | null;
  estimatedCompletionMonth: string | null;
  outsideWindowLabel: string;
}

export function GoalForecastCard({
  name,
  monthsToCompletion,
  estimatedCompletionMonth,
  outsideWindowLabel,
}: GoalForecastCardProps) {
  function formatCompletionMonth(monthKey: string): string {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-cream-300 bg-white px-4 py-3">
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
  );
}
