export interface ForecastConfig {
  defaultIncome: number;
  monthlyExpense: number;
  annualRate: number;
  incomeOverrides: Record<string, number>; // key: "YYYY-MM"
}

export const DEFAULT_ANNUAL_RATE = 4.6;
