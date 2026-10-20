import type { FinanceV2Transaction } from "./FinanceV2Transaction";

/** Money into (`deposited`) and out of the fund for a list of transactions —
 *  typically one month's. Out is split in two so the user can tell money taken
 *  back to the account (`withdrawn`) from money spent on something (`spent`). */
export interface SavingsFundFlows {
  deposited: number;
  withdrawn: number;
  spent: number;
}

/** `spent` reads only the `paidFrom` snapshot, never the current category:
 *  editing or deleting a category must not rewrite history. */
export function computeSavingsFundFlows(transactions: FinanceV2Transaction[]): SavingsFundFlows {
  let deposited = 0;
  let withdrawn = 0;
  let spent = 0;
  for (const tx of transactions) {
    if (tx.type === "savings") deposited += tx.amount;
    else if (tx.type === "withdrawal") withdrawn += tx.amount;
    else if (tx.type === "expense" && tx.paidFrom === "savingsFund") spent += tx.amount;
  }
  return { deposited, withdrawn, spent };
}
