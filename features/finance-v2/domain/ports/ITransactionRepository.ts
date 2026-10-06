import type { FinanceV2Transaction } from "../FinanceV2Transaction";

/**
 * Port: the contract the domain requires for transaction persistence.
 *
 * The domain expresses what it needs (load/save per month, bulk load for
 * multi-month reads, append-only write for cross-month entries). The adapter
 * decides how to fulfil each operation — key scheme, store type, batching.
 */
export interface ITransactionRepository {
  /**
   * Returns all transactions for the given YYYY-MM month.
   * Returns an empty array when the month has no data.
   */
  loadForMonth(month: string): Promise<FinanceV2Transaction[]>;

  /**
   * Returns all transactions for the given months in one batch,
   * concatenated in the order the months array provides.
   * Returns an empty array when no months are provided.
   */
  loadForMonths(months: string[]): Promise<FinanceV2Transaction[]>;

  /**
   * Replaces the full transaction list for `month`.
   * Used when the caller already holds the authoritative list (whole-list save).
   */
  saveForMonth(month: string, transactions: FinanceV2Transaction[]): Promise<void>;

  /**
   * Appends a single transaction to the stored list for its own month
   * (`tx.month`), performing a read-modify-write internally.
   * Used when a transaction belongs to a month other than the currently viewed one.
   */
  appendToMonth(tx: FinanceV2Transaction): Promise<void>;
}
