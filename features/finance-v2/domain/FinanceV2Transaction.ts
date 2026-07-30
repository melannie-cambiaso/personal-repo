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

interface TransactionBase {
  id: string;
  amount: number;
  /** YYYY-MM-DD, user-picked at creation. */
  date: string;
  /** YYYY-MM. User-assigned, NOT derived from `date`. Mirrors the storage key. */
  month: string;
  note?: string;
}

/** Discriminated on `type` so an income/savings record has no `bucket` field
 *  to set wrong — only the `expense` variant carries `bucket`/`category`. */
export type FinanceV2Transaction =
  | (TransactionBase & { type: "income" })
  | (TransactionBase & { type: "savings"; category: TransactionCategoryRef | null })
  | (TransactionBase & {
      type: "expense";
      bucket: ExpenseBucketKey;
      category: TransactionCategoryRef | null;
    });
