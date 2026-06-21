export interface ForecastMonth {
  month: string;
  projectedBalance: number;
}

export function computeForecast(
  currentBalance: number,
  monthlyNet: number,
  months: number
): ForecastMonth[] {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
  return Array.from({ length: months }, (_, i) => ({
    month: fmt.format(new Date(now.getFullYear(), now.getMonth() + i + 1, 1)),
    projectedBalance: currentBalance + monthlyNet * (i + 1),
  }));
}
