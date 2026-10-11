import type { BudgetConfig } from "./BudgetConfig";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

/** `difference` is `real - budgeted`: positive means the source earned more than
 *  planned. That is the opposite subtraction of the expense side
 *  (`budgeted - spent`), so on both sides a positive difference is good news. */
export interface IncomeRow {
  id: string;
  name: string;
  budgeted: number;
  real: number;
  difference: number;
}

export interface IncomeComparison {
  /** One row per budget income source, in budget order. */
  rows: IncomeRow[];
  /** Income with no source, or whose source is no longer in the budget ("Sin
   *  fuente"). ALREADY INCLUDED in `total.real`, so the rows can sum to less. */
  unassigned: number;
  total: { budgeted: number; real: number; difference: number };
}

export function computeIncomeComparison(
  config: BudgetConfig,
  transactions: FinanceV2Transaction[]
): IncomeComparison {
  const sources = config.incomeSources ?? [];
  const realById = new Map<string, number>(sources.map((source) => [source.id, 0]));
  let unassigned = 0;
  let real = 0;

  for (const tx of transactions) {
    if (tx.type !== "income") continue;
    real += tx.amount;
    const id = tx.source?.id;
    if (id !== undefined && realById.has(id)) realById.set(id, realById.get(id)! + tx.amount);
    else unassigned += tx.amount;
  }

  const rows = sources.map((source) => {
    const sourceReal = realById.get(source.id)!;
    return {
      id: source.id,
      name: source.name,
      budgeted: source.amount,
      real: sourceReal,
      difference: sourceReal - source.amount,
    };
  });
  const budgeted = sources.reduce((sum, source) => sum + source.amount, 0);

  return { rows, unassigned, total: { budgeted, real, difference: real - budgeted } };
}
