export function computePendingExpenses(
  budget: Record<string, number>,
  actual: Record<string, number>,
  expenseCategories: string[],
  closedCategories?: string[],
  excludedCategories?: string[]
): number {
  const closed = new Set(closedCategories ?? []);
  const excluded = new Set(excludedCategories ?? []);
  return expenseCategories.reduce(
    (sum, cat) =>
      closed.has(cat) || excluded.has(cat)
        ? sum
        : sum + Math.max(0, (budget[cat] ?? 0) - (actual[cat] ?? 0)),
    0
  );
}
