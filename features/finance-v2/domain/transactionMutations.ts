import type { FinanceV2Transaction } from "./FinanceV2Transaction";

/** Unconditionally appends `tx`. `tx.month` is a user-assigned field
 *  independent of `date` (no derived-month guard here anymore — the caller's
 *  hook routes on `tx.month` instead). Input is never mutated. */
export function addTransaction(
  list: FinanceV2Transaction[],
  tx: FinanceV2Transaction
): FinanceV2Transaction[] {
  return [...list, tx];
}

/** Unknown ids leave the list unchanged (no throw), mirrors `setLeafAmount`. */
export function deleteTransaction(
  list: FinanceV2Transaction[],
  id: string
): FinanceV2Transaction[] {
  return list.filter((tx) => tx.id !== id);
}

/** Replaces the transaction sharing `tx.id`, keeping its position. Unknown
 *  ids leave the list unchanged (no throw), mirrors `deleteTransaction`.
 *  Input is never mutated. */
export function updateTransaction(
  list: FinanceV2Transaction[],
  tx: FinanceV2Transaction
): FinanceV2Transaction[] {
  return list.map((existing) => (existing.id === tx.id ? tx : existing));
}
