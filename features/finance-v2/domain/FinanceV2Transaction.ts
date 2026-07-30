import type { BucketKey } from "./BucketKey";

/** `"savings"` is a transaction `type`, never a valid expense bucket — stays
 *  coupled to `BucketKey` so widening that union breaks this
 *  loudly instead of silently accepting an invalid bucket. */
export type ExpenseBucketKey = Extract<BucketKey, "fixed" | "variable">;

/** Snapshotted at creation time. `name` is what every read path renders —
 *  never a live lookup against current Budget-tab state (passive orphan
 *  handling: see `transactionMutations`/`TransactionRow`). */
export interface TransactionCategoryRef {
  id: string;
  name: string;
}

/** Snapshot taken at creation. `bucket` is NOT decoration: it is the only way
 *  `resolveUnassignedBucket` can place this amount once the referenced leaf is
 *  deleted from the config (the savings variant has no `bucket` of its own). */
export interface TransactionSourceCategoryRef extends TransactionCategoryRef {
  bucket: ExpenseBucketKey;
}

interface TransactionBase {
  id: string;
  amount: number;
  /** YYYY-MM-DD, user-picked at creation. */
  date: string;
  /** YYYY-MM. User-assigned, NOT derived from `date`. Mirrors the storage key. */
  month: string;
  note?: string;
}

/** Discriminated on `type`. The `expense` variant carries `bucket`/`category`
 *  directly; `savings` optionally carries a `sourceCategory` snapshot (with
 *  its own `bucket`) when tagged as reallocated leftover budget — `income`
 *  never carries either. */
export type FinanceV2Transaction =
  | (TransactionBase & { type: "income" })
  | (TransactionBase & { type: "savings"; sourceCategory?: TransactionSourceCategoryRef })
  | (TransactionBase & {
      type: "expense";
      bucket: ExpenseBucketKey;
      category: TransactionCategoryRef | null;
    });
