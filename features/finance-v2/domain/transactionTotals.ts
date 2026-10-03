import type { FinanceV2Transaction } from "./FinanceV2Transaction";

export interface TransactionTotals {
  income: number;
  /** Main-account spend only: an expense stamped `paidFrom: "envelope"` is
   *  excluded (it is paid from money that already left via a `transfer`, so
   *  counting it here too would subtract it twice). Legacy expenses have no
   *  `paidFrom` and always count. */
  expense: number;
  savings: number;
  /** Plain monthly sum of main account -> envelope transfers. */
  transfer: number;
  /** `income - expense - savings - transfer`. Tagging a transaction `savings` means
   *  the money physically left the checking account, exactly like an expense, so it
   *  subtracts here too — a balance that ignored it would overstate available money.
   *  `savings` is ALSO reported on its own as a plain monthly sum, so "how much did
   *  I save this month" stays answerable. Still no comparison to tab 1's target.
   *  (Supersedes the `income - expense` rule locked by
   *  sdd/finance-v2-transactions-tab, reversed 2026-07-29.)
   *  A `transfer` leaves the main account the same way, while envelope-paid
   *  expenses do not touch it at all (added 2026-09-30 by
   *  finance-v2-envelope-account). */
  balance: number;
}

export function computeTransactionTotals(list: FinanceV2Transaction[]): TransactionTotals {
  let income = 0;
  let expense = 0;
  let savings = 0;
  let transfer = 0;

  for (const tx of list) {
    switch (tx.type) {
      case "income":
        income += tx.amount;
        break;
      case "expense":
        if (tx.paidFrom !== "envelope") expense += tx.amount;
        break;
      case "savings":
        savings += tx.amount;
        break;
      case "transfer":
        transfer += tx.amount;
        break;
      default: {
        // Compile-time exhaustiveness: a new transaction `type` must decide
        // how it affects the main account instead of silently counting nowhere.
        const unhandled: never = tx;
        throw new Error(
          `computeTransactionTotals: unhandled transaction ${JSON.stringify(unhandled)}`
        );
      }
    }
  }

  return { income, expense, savings, transfer, balance: income - expense - savings - transfer };
}
