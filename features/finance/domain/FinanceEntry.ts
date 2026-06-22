export interface FinanceEntry {
  id: string;
  type: "income" | "expense";
  group: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  createdAt: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  byGroup: Map<string, number>;
}
