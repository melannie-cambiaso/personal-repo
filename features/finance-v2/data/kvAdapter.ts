import "server-only";
import { redis } from "@/shared/kv";
import { DEFAULT_BUDGET_CONFIG, upsertBudgetVersion } from "@/features/finance-v2/domain";
import type {
  BudgetConfig,
  BudgetVersion,
  EnvelopeConfig,
  FinanceV2Transaction,
} from "@/features/finance-v2/domain";

// Pre-versioning global budget tree. Read-only now: it only seeds the versions list
// below, and is never written or deleted (a rollback can still read it).
const BUDGET_CONFIG_KEY = "finance-v2-budget-config";
// Effective-dated budget versions (see `domain/budgetVersions.ts`), one global list.
const BUDGET_VERSIONS_KEY = "finance-v2-budget-versions";

// Throws on a redis error, unlike the public loaders: `saveBudgetVersion` must tell a
// failed read apart from "no versions yet", or a write would wipe every stored version.
// Legacy backfill on read: a missing versions key becomes one `"0000-00"` version holding
// the legacy config, so every existing month keeps the budget it showed before. The seed
// is persisted only by the first `saveBudgetVersion`.
async function readBudgetVersions(): Promise<BudgetVersion[]> {
  const stored = await redis.get<BudgetVersion[]>(BUDGET_VERSIONS_KEY);
  if (stored) return stored;
  const legacy = (await redis.get<BudgetConfig>(BUDGET_CONFIG_KEY)) ?? DEFAULT_BUDGET_CONFIG;
  return [{ effectiveFrom: "0000-00", config: legacy, updatedAt: new Date().toISOString() }];
}

export async function loadBudgetVersions(): Promise<BudgetVersion[]> {
  try {
    return await readBudgetVersions();
  } catch {
    return []; // every month resolves to `DEFAULT_BUDGET_CONFIG`
  }
}

/** Read-upsert-write of `month`'s version only; every other version is kept. */
export async function saveBudgetVersion(month: string, config: BudgetConfig): Promise<void> {
  try {
    const versions = await readBudgetVersions();
    await redis.set(
      BUDGET_VERSIONS_KEY,
      upsertBudgetVersion(versions, month, config, new Date().toISOString())
    );
  } catch {
    // swallow — caller has no recovery path; versions revert to in-memory state on next load
  }
}

// Same global key pattern as the budget versions, but a miss is `null`, not a default:
// no stored config means the envelope feature is off.
const ENVELOPE_CONFIG_KEY = "finance-v2-envelope-config";

export async function loadEnvelopeConfig(): Promise<EnvelopeConfig | null> {
  try {
    return (await redis.get<EnvelopeConfig>(ENVELOPE_CONFIG_KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function saveEnvelopeConfig(config: EnvelopeConfig): Promise<void> {
  try {
    await redis.set(ENVELOPE_CONFIG_KEY, config);
  } catch {
    // swallow — caller has no recovery path; config reverts to in-memory state on next load
  }
}

// The only month-scoped store in v2 — a key factory (like v1's `monthlyKvStore`) would be
// premature for a single store. This is the ONLY place `finance-v2-transactions:{month}`
// keys are built.
export const transactionsKey = (month: string): string => `finance-v2-transactions:${month}`;

export async function loadTransactions(month: string): Promise<FinanceV2Transaction[]> {
  try {
    const stored = (await redis.get<FinanceV2Transaction[]>(transactionsKey(month))) ?? [];
    return backfillMonth(stored, month);
  } catch {
    return [];
  }
}

/** Every listed month's transactions in ONE `mget` (the envelope's carried balance
 *  spans every month since `openingMonth`), concatenated in the order given. Each
 *  list gets the same legacy backfill as `loadTransactions`, from its own key's month. */
export async function loadTransactionsForMonths(months: string[]): Promise<FinanceV2Transaction[]> {
  if (months.length === 0) return []; // `mget` with no keys is a redis error
  try {
    const stored = await redis.mget<(FinanceV2Transaction[] | null)[]>(
      ...months.map(transactionsKey)
    );
    return months.flatMap((month, i) => backfillMonth(stored[i] ?? [], month));
  } catch {
    return [];
  }
}

// Legacy backfill: a record saved before `month` existed is treated as belonging to
// the key it was loaded from — no separate migration step (spec: Legacy Month Backfill
// on Read). Idempotent: a record that already has `month` is left untouched.
function backfillMonth(list: FinanceV2Transaction[], month: string): FinanceV2Transaction[] {
  return list.map((tx) => ({ ...tx, month: tx.month ?? month }));
}

export async function saveTransactions(
  month: string,
  transactions: FinanceV2Transaction[]
): Promise<void> {
  try {
    await redis.set(transactionsKey(month), transactions);
  } catch {
    // swallow — caller has no recovery path; list reverts to in-memory state on next load
  }
}

/** Read-append-write scoped to `month`'s key ONLY — composed of `loadTransactions`/
 *  `saveTransactions` (not a raw redis pair) so key construction stays in `transactionsKey`
 *  and this inherits the legacy backfill in `loadTransactions` for free. Used when a
 *  transaction's `month` differs from the currently viewed month (design decision #1). */
export async function appendTransactionToMonth(
  month: string,
  tx: FinanceV2Transaction
): Promise<void> {
  const list = await loadTransactions(month);
  await saveTransactions(month, [...list, tx]);
}
