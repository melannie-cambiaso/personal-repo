import type {
  FinanceV2Transaction,
  SavingsFundConfig,
  SavingsFundFlows,
} from "@/features/finance-v2/domain";
import { computeSavingsFundFlows } from "@/features/finance-v2/domain";

/** Everything the Movimientos tab needs to render the savings fund for the viewed month,
 *  derived once in `FinanceV2Screen` so `SavingsFundCard` stays math-free. `null` at the
 *  call site means "no savings fund configured". */
export interface SavingsFundView {
  config: SavingsFundConfig;
  /** Balance at the START of the viewed month. `null` while either the month's
   *  transactions or the carried-in figure are still loading, so the consumer never
   *  needs a separate loading flag. */
  carriedIn: number | null;
  /** The viewed month's own flows, from the in-memory (possibly optimistic) list. */
  flows: SavingsFundFlows;
}

interface Params {
  config: SavingsFundConfig | null;
  carriedIn: number | null;
  isLoading: boolean;
  transactions: FinanceV2Transaction[];
}

export function toSavingsFundView({
  config,
  carriedIn,
  isLoading,
  transactions,
}: Params): SavingsFundView | null {
  if (config === null) return null;
  return {
    config,
    carriedIn: isLoading ? null : carriedIn,
    flows: computeSavingsFundFlows(transactions),
  };
}
