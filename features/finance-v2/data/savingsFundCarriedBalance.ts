import "server-only";
import type { SavingsFundConfig } from "@/features/finance-v2/domain";
import { computeSavingsFundFlows, monthsFromTo } from "@/features/finance-v2/domain";
import type { ITransactionRepository } from "@/features/finance-v2/domain/ports";

/** The savings fund balance at the START of `month`: `openingBalance` plus every
 *  deposit minus every withdrawal and fund-paid expense in `[openingMonth, month)`.
 *  The viewed month itself is excluded on purpose — the client adds its in-memory
 *  list, which may hold optimistic mutations not yet persisted. `null` when there
 *  is no fund or `month` predates it; the opening month short-circuits without a
 *  KV read. Mirrors `loadEnvelopeCarriedBalance`, including the injected `repo`. */
export async function loadSavingsFundCarriedBalance(
  config: SavingsFundConfig | null,
  month: string,
  repo: ITransactionRepository
): Promise<number | null> {
  if (config === null || month < config.openingMonth) return null;
  if (month === config.openingMonth) return config.openingBalance;

  const flows = computeSavingsFundFlows(
    await repo.loadForMonths(monthsFromTo(config.openingMonth, month))
  );
  return config.openingBalance + flows.deposited - flows.withdrawn - flows.spent;
}
