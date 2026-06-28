import type { ForecastConfig } from "./ForecastConfig";

export interface ForecastMonth {
  monthKey: string;
  month: string;
  projectedBalance: number;
}

export function computeForecast(
  currentBalance: number,
  config: ForecastConfig,
  months: number
): ForecastMonth[] {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });
  const monthlyRate =
    config.annualRate > 0 ? Math.pow(1 + config.annualRate / 100, 1 / 12) - 1 : 0;

  let balance = currentBalance;
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const income = config.incomeOverrides[monthKey] ?? config.defaultIncome;
    balance = (balance + (income - config.monthlyExpense)) * (1 + monthlyRate);
    return {
      monthKey,
      month: fmt.format(d),
      projectedBalance: balance,
    };
  });
}
