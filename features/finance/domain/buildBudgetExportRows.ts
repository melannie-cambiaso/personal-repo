import type { FinanceTransaction } from "./FinanceTransaction";
import { computeActualFromTransactions } from "./computeActualFromTransactions";

// Local type alias — mirrors Group from kvAdapter without pulling in server-only
type Group = { name: string; type: "income" | "expense" | "refund"; categories: string[] };

export interface BudgetExportRow {
  categoria: string;
  presupuestado: number;
  real: number;
  diferencia: number;
  cerrada: boolean;
}

export function buildBudgetExportRows(
  groups: Group[],
  budget: Record<string, number>,
  transactions: FinanceTransaction[],
  closedCategories: string[] = [],
  excludedCategories: string[] = []
): BudgetExportRow[] {
  const actual = computeActualFromTransactions(transactions);
  const closed = new Set(closedCategories);
  const excluded = new Set(excludedCategories);

  const order = { income: 0, expense: 1, refund: 2 } as const;
  const orderedGroups = [...groups].sort((a, b) => order[a.type] - order[b.type]);

  const rows: BudgetExportRow[] = [];
  for (const group of orderedGroups) {
    const categories = [...group.categories].sort((a, b) => a.localeCompare(b, "es"));
    for (const categoria of categories) {
      if (group.type === "expense" && excluded.has(categoria)) continue;
      const presupuestado = budget[categoria] ?? 0;
      const real = actual[categoria] ?? 0;
      const diferencia = group.type === "expense" ? presupuestado - real : real - presupuestado;
      const cerrada = group.type === "expense" && closed.has(categoria);
      rows.push({ categoria, presupuestado, real, diferencia, cerrada });
    }
  }

  return rows;
}
