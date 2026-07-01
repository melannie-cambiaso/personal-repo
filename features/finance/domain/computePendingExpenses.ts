export function computePendingExpenses(
  budget: Record<string, number>,
  actual: Record<string, number>,
  expenseCategories: string[],
): number {
  return expenseCategories.reduce(
    (sum, cat) => sum + Math.max(0, (budget[cat] ?? 0) - (actual[cat] ?? 0)),
    0,
  );
}
