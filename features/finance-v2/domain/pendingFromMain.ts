import type { BudgetConfig } from "./BudgetConfig";
import type { EnvelopeConfig } from "./EnvelopeConfig";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";
import { resolvePaidFrom } from "./envelope";
import { computeSpendComparison } from "./spendRollup";

/** What is still left to pay from the main account in `month`: each budget
 *  leaf's remaining (`budgeted − spent`, via `computeSpendComparison`) summed
 *  across every bucket, savings included. The clamp is PER LEAF: an overspent
 *  leaf is already paid and contributes 0, but its overrun never lowers what
 *  another leaf still owes. Leaves the envelope pays (see `resolvePaidFrom`)
 *  are excluded because that money leaves the envelope, not the main account;
 *  `null` or a bound category missing from `config` excludes nothing.
 *  Unassigned spend has no leaf to owe against, so it never creates pending. */
export function computePendingFromMain(
  config: BudgetConfig,
  transactions: FinanceV2Transaction[],
  month: string,
  envelope: EnvelopeConfig | null
): number {
  const monthTransactions = transactions.filter((tx) => tx.month === month);
  const { leaves } = computeSpendComparison(config, monthTransactions, month);

  let pending = 0;
  for (const [leafId, row] of Object.entries(leaves)) {
    if (resolvePaidFrom(envelope, config, leafId) === "envelope") continue;
    pending += Math.max(row.budgeted - row.spent, 0);
  }
  return pending;
}
