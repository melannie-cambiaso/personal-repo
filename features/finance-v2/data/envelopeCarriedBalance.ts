import "server-only";
import type { EnvelopeConfig } from "@/features/finance-v2/domain";
import { computeEnvelopeFlows, monthsFromTo } from "@/features/finance-v2/domain";
import { loadTransactionsForMonths } from "./kvAdapter";

/** The envelope balance at the START of `month` (design D2): `openingBalance` plus
 *  every transfer minus every envelope-paid expense in `[openingMonth, month)`. The
 *  viewed month itself is excluded on purpose — the client adds its in-memory list,
 *  which may hold optimistic mutations not yet persisted. `null` when there is no
 *  envelope or `month` predates it; the opening month short-circuits without a KV read.
 *
 *  Not a Server Action: shared by the RSC page (gated by its own redirect) and by
 *  `handleLoadEnvelopeCarriedBalance` (which gates auth and validates `month` first). */
export async function loadEnvelopeCarriedBalance(
  config: EnvelopeConfig | null,
  month: string,
): Promise<number | null> {
  if (config === null || month < config.openingMonth) return null;
  if (month === config.openingMonth) return config.openingBalance;

  const flows = computeEnvelopeFlows(
    await loadTransactionsForMonths(monthsFromTo(config.openingMonth, month)),
  );
  return config.openingBalance + flows.transferred - flows.paid;
}
