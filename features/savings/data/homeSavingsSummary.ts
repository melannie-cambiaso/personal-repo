import "server-only";
import { computePeriodBalance } from "../domain/computePeriodBalance";
import { computeTotalToReplenish } from "../domain/computeTotalToReplenish";
import { resolveActivePeriod, selectPeriodEntries } from "../domain/SavingsPeriod";
import { loadEntries, loadPeriods } from "./kvAdapter";

export interface HomeSavingsSummary {
  balance: number;
  toReplenish: number;
}

/** The savings summary shown on the home page: balance and amount to replenish of the
 *  active period, resolved and computed with the same domain functions as the `/savings`
 *  page (`useSavings`) so both pages never disagree.
 *
 *  Not a Server Action: consumed by the RSC page after its own cookie gate, same as
 *  `loadHomeWishlistSummary`. Imported by path, like its siblings, so the `data` barrel
 *  stays limited to the storage adapter. */
export async function loadHomeSavingsSummary(): Promise<HomeSavingsSummary> {
  const [entries, periods] = await Promise.all([loadEntries(), loadPeriods()]);
  const activePeriod = resolveActivePeriod(periods);
  const activeEntries = selectPeriodEntries(entries, activePeriod.id);
  return {
    balance: computePeriodBalance(activeEntries, activePeriod),
    toReplenish: computeTotalToReplenish(activeEntries),
  };
}
