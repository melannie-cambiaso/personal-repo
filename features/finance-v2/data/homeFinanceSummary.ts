import "server-only";
import { computePendingFromMain, computeTransactionTotals } from "@/features/finance-v2/domain";
import { loadBudgetConfig, loadEnvelopeConfig, loadTransactions } from "./kvAdapter";

export interface HomeFinanceSummary {
  month: string;
  /** Same figure as the finance-v2 Movimientos balance (`computeTransactionTotals`). */
  balance: number;
  /** Same figure as the Budget tab `AccountCoverage` pending (`computePendingFromMain`). */
  pending: number;
}

/** The current-month summary shown on the home page, computed with the same domain
 *  functions and inputs as `FinanceV2Screen` so both pages never disagree. The
 *  surplus/shortfall (`balance − pending`) is left to the UI, like `AccountCoverage`.
 *
 *  Not a Server Action: consumed by the RSC page after its own cookie gate, same as
 *  the other `load*` loaders. */
export async function loadHomeFinanceSummary(month: string): Promise<HomeFinanceSummary> {
  const [budget, transactions, envelopeConfig] = await Promise.all([
    loadBudgetConfig(),
    loadTransactions(month),
    loadEnvelopeConfig(),
  ]);

  return {
    month,
    balance: computeTransactionTotals(transactions).balance,
    pending: computePendingFromMain(
      { categories: budget.categories },
      transactions,
      month,
      envelopeConfig
    ),
  };
}
