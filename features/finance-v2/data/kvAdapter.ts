import "server-only";
import { redis } from "@/shared/kv";
import { DEFAULT_BUDGET_CONFIG, upsertBudgetVersion } from "@/features/finance-v2/domain";
import type {
  BudgetConfig,
  BudgetVersion,
  EnvelopeConfig,
  FinanceV2Transaction,
} from "@/features/finance-v2/domain";
import type {
  IBudgetRepository,
  IEnvelopeRepository,
  ITransactionRepository,
} from "@/features/finance-v2/domain/ports";

// ---------------------------------------------------------------------------
// Redis key definitions — the only place these strings exist in the codebase.
// ---------------------------------------------------------------------------

// Pre-versioning global budget tree. Read-only: seeds the versions list on first access.
const BUDGET_CONFIG_KEY = "finance-v2-budget-config";
// Effective-dated budget versions (see `domain/budgetVersions.ts`), one global list.
const BUDGET_VERSIONS_KEY = "finance-v2-budget-versions";
// Single optional global envelope configuration.
const ENVELOPE_CONFIG_KEY = "finance-v2-envelope-config";
// Month-scoped transaction list. The only place this key pattern is built.
// Exported for tests that need to assert on stored keys.
export const transactionsKey = (month: string): string => `finance-v2-transactions:${month}`;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// Throws on a redis error (unlike the public loaders): `BudgetKvAdapter.saveVersion`
// must distinguish a failed read from "no versions yet", or a write would wipe the
// entire stored list.
// Legacy backfill on read: a missing versions key becomes one `"0000-00"` version
// holding the legacy config, so every existing month keeps the budget it showed before.
// The seed is persisted only by the first `saveVersion` call.
async function readBudgetVersions(): Promise<BudgetVersion[]> {
  const stored = await redis.get<BudgetVersion[]>(BUDGET_VERSIONS_KEY);
  if (stored) return stored;
  const legacy = (await redis.get<BudgetConfig>(BUDGET_CONFIG_KEY)) ?? DEFAULT_BUDGET_CONFIG;
  return [{ effectiveFrom: "0000-00", config: legacy, updatedAt: new Date().toISOString() }];
}

// Legacy backfill: a record saved before the `month` field existed is treated as
// belonging to the key it was loaded from — no separate migration step.
// Idempotent: a record that already has `month` is left untouched.
function backfillMonth(list: FinanceV2Transaction[], month: string): FinanceV2Transaction[] {
  return list.map((tx) => ({ ...tx, month: tx.month ?? month }));
}

// ---------------------------------------------------------------------------
// Adapter: IBudgetRepository
// ---------------------------------------------------------------------------

/**
 * Redis implementation of IBudgetRepository.
 *
 * The `satisfies` keyword (rather than `: IBudgetRepository`) lets TypeScript
 * verify the shape without widening the type, so the object keeps its concrete
 * method signatures for internal callers that depend on them.
 */
export const BudgetKvAdapter = {
  async loadVersions(): Promise<BudgetVersion[]> {
    try {
      return await readBudgetVersions();
    } catch {
      return []; // every month resolves to DEFAULT_BUDGET_CONFIG
    }
  },

  /** Read-upsert-write of `month`'s version only; every other version is kept. */
  async saveVersion(month: string, config: BudgetConfig): Promise<void> {
    try {
      const versions = await readBudgetVersions();
      await redis.set(
        BUDGET_VERSIONS_KEY,
        upsertBudgetVersion(versions, month, config, new Date().toISOString())
      );
    } catch {
      // swallow — caller has no recovery path; versions revert to in-memory state on next load
    }
  },
} satisfies IBudgetRepository;

// ---------------------------------------------------------------------------
// Adapter: ITransactionRepository
// ---------------------------------------------------------------------------

export const TransactionKvAdapter = {
  async loadForMonth(month: string): Promise<FinanceV2Transaction[]> {
    try {
      const stored = (await redis.get<FinanceV2Transaction[]>(transactionsKey(month))) ?? [];
      return backfillMonth(stored, month);
    } catch {
      return [];
    }
  },

  /** Every listed month's transactions in ONE `mget`, concatenated in order.
   *  Each list gets the same legacy backfill as `loadForMonth`. */
  async loadForMonths(months: string[]): Promise<FinanceV2Transaction[]> {
    if (months.length === 0) return []; // mget with no keys is a redis error
    try {
      const stored = await redis.mget<(FinanceV2Transaction[] | null)[]>(
        ...months.map(transactionsKey)
      );
      return months.flatMap((month, i) => backfillMonth(stored[i] ?? [], month));
    } catch {
      return [];
    }
  },

  async saveForMonth(month: string, transactions: FinanceV2Transaction[]): Promise<void> {
    try {
      await redis.set(transactionsKey(month), transactions);
    } catch {
      // swallow — caller has no recovery path; list reverts to in-memory state on next load
    }
  },

  /** Read-append-write scoped to `tx.month`'s key ONLY — composed of the two methods
   *  above so key construction stays in `transactionsKey` and this inherits the legacy
   *  backfill in `loadForMonth` for free. Used when a transaction's month differs from
   *  the currently viewed month (design decision #1). */
  async appendToMonth(tx: FinanceV2Transaction): Promise<void> {
    const list = await this.loadForMonth(tx.month);
    await this.saveForMonth(tx.month, [...list, tx]);
  },
} satisfies ITransactionRepository;

// ---------------------------------------------------------------------------
// Adapter: IEnvelopeRepository
// ---------------------------------------------------------------------------

export const EnvelopeKvAdapter = {
  async load(): Promise<EnvelopeConfig | null> {
    try {
      return (await redis.get<EnvelopeConfig>(ENVELOPE_CONFIG_KEY)) ?? null;
    } catch {
      return null;
    }
  },

  async save(config: EnvelopeConfig): Promise<void> {
    try {
      await redis.set(ENVELOPE_CONFIG_KEY, config);
    } catch {
      // swallow — caller has no recovery path; config reverts to in-memory state on next load
    }
  },
} satisfies IEnvelopeRepository;

// ---------------------------------------------------------------------------
// Legacy function aliases
// ---------------------------------------------------------------------------
// These thin wrappers preserve the function-based call sites used by:
//   - data/index.ts barrel (loadBudgetVersions, loadTransactions, loadEnvelopeConfig,
//     saveEnvelopeConfig)
//   - data/envelopeCarriedBalance.ts (loadTransactionsForMonths)
//   - data/financeV2Actions.ts (saveBudgetVersion, saveTransactions,
//     appendTransactionToMonth, saveEnvelopeConfig)
//
// Migrating those call sites to the adapter objects is the natural next step, but
// keeping these aliases here means zero breakage today.

export const loadBudgetVersions = () => BudgetKvAdapter.loadVersions();
export const saveBudgetVersion = (month: string, config: BudgetConfig) =>
  BudgetKvAdapter.saveVersion(month, config);

export const loadTransactions = (month: string) => TransactionKvAdapter.loadForMonth(month);
export const loadTransactionsForMonths = (months: string[]) =>
  TransactionKvAdapter.loadForMonths(months);
export const saveTransactions = (month: string, transactions: FinanceV2Transaction[]) =>
  TransactionKvAdapter.saveForMonth(month, transactions);
export const appendTransactionToMonth = (month: string, tx: FinanceV2Transaction) =>
  TransactionKvAdapter.appendToMonth({ ...tx, month });

export const loadEnvelopeConfig = () => EnvelopeKvAdapter.load();
export const saveEnvelopeConfig = (config: EnvelopeConfig) => EnvelopeKvAdapter.save(config);
