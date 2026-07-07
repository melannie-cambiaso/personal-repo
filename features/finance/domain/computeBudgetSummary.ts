export interface BudgetSummary {
  actualNet: number; // actualIncome − actualExpense (refunds excluded)
  realBalance: number; // actualNet + actualRefund
  potentialSavings: number; // budgetRefund − actualRefund
  available: number; // realBalance − pendingExpenses
  pendingExpenses: number; // passed through for the caller
}

export function computeBudgetSummary(input: {
  actualIncome: number;
  actualExpense: number;
  actualRefund: number;
  budgetRefund: number;
  pendingExpenses: number;
}): BudgetSummary {
  const { actualIncome, actualExpense, actualRefund, budgetRefund, pendingExpenses } = input;

  const actualNet = actualIncome - actualExpense;
  const realBalance = actualNet + actualRefund;
  const available = realBalance - pendingExpenses;
  const potentialSavings = budgetRefund - actualRefund;

  return { actualNet, realBalance, potentialSavings, available, pendingExpenses };
}
