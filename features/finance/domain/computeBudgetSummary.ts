export interface BudgetSummary {
  actualNet: number; // actualIncome − actualExpense (refunds excluded — they're routed to savings)
  potentialSavings: number; // budgetRefund − actualRefund
  available: number; // actualNet − pendingExpenses (refunds excluded)
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
  const available = actualNet - pendingExpenses;
  const potentialSavings = budgetRefund - actualRefund;

  return { actualNet, potentialSavings, available, pendingExpenses };
}
