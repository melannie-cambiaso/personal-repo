export interface ForecastMonth {
  month: string;
  projectedBalance: number;
}

export function computeForecast(
  currentBalance: number,
  monthlyNet: number,
  months: number,
  annualRate = 0
): ForecastMonth[] {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
  const monthlyRate = annualRate > 0 ? Math.pow(1 + annualRate / 100, 1 / 12) - 1 : 0;

  let balance = currentBalance;
  return Array.from({ length: months }, (_, i) => {
    balance = (balance + monthlyNet) * (1 + monthlyRate);
    return {
      month: fmt.format(new Date(now.getFullYear(), now.getMonth() + i + 1, 1)),
      projectedBalance: balance,
    };
  });
}
