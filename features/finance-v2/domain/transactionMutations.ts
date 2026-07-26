import type { FinanceV2Transaction } from "./FinanceV2Transaction";
import { monthOf } from "./transactionDate";

/** Appends `tx` only when its date belongs to `month`; otherwise returns the
 *  list unchanged. Guards against a server/client timezone mismatch at month
 *  edges keeping a stored array homogeneous by construction (design decision:
 *  Month integrity). Input is never mutated. */
export function addTransaction(
  list: FinanceV2Transaction[],
  tx: FinanceV2Transaction,
  month: string,
): FinanceV2Transaction[] {
  if (monthOf(tx.date) !== month) return list;
  return [...list, tx];
}

/** Unknown ids leave the list unchanged (no throw), mirrors `setLeafAmount`. */
export function deleteTransaction(
  list: FinanceV2Transaction[],
  id: string,
): FinanceV2Transaction[] {
  return list.filter((tx) => tx.id !== id);
}
