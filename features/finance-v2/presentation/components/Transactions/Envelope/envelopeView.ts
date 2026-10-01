import type {
  BudgetConfig,
  EnvelopeConfig,
  EnvelopeFlows,
  FinanceV2Transaction,
} from "@/features/finance-v2/domain";
import { computeEnvelopeFlows, suggestedTransfer } from "@/features/finance-v2/domain";

/** Everything the Movimientos tab needs to render the envelope for the viewed month,
 *  derived once in `FinanceV2Screen` so `EnvelopeCard` and `EnvelopeReminder` stay
 *  math-free. `null` at the call site means "no envelope configured". */
export interface EnvelopeView {
  config: EnvelopeConfig;
  /** Balance at the START of the viewed month (design D2). `null` when the month
   *  predates the envelope OR while either the month's transactions or the carried-in
   *  figure are still loading — both hide the card and the reminder, so the consumers
   *  never need a separate loading flag. */
  carriedIn: number | null;
  /** The viewed month's own flows, from the in-memory (possibly optimistic) list. */
  flows: EnvelopeFlows;
  /** Bound category's monthly budget for the viewed month; `null` when that category
   *  no longer exists (the reminder then asks to reconfigure). */
  suggestedTransfer: number | null;
}

interface Params {
  config: EnvelopeConfig | null;
  carriedIn: number | null;
  isLoading: boolean;
  transactions: FinanceV2Transaction[];
  budget: BudgetConfig;
  month: string;
}

export function toEnvelopeView({
  config,
  carriedIn,
  isLoading,
  transactions,
  budget,
  month,
}: Params): EnvelopeView | null {
  if (config === null) return null;
  return {
    config,
    carriedIn: isLoading ? null : carriedIn,
    flows: computeEnvelopeFlows(transactions),
    suggestedTransfer: suggestedTransfer(config, budget, month),
  };
}
