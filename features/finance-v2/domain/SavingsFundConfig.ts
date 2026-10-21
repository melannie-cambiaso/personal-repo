/** The single, optional, global "savings fund": money kept apart from the main
 *  account, tracked inside finance-v2 independently of the `savings` feature.
 *  Stored as `SavingsFundConfig | null`; `null` means the feature is off and
 *  finance-v2 behaves exactly as before it existed. Unlike the envelope it is
 *  bound to no budget category: ANY expense can be paid from it (see
 *  `paidFrom: "savingsFund"`). Its balance is NEVER stored — it is always
 *  derived from `openingBalance` plus the transactions since `openingMonth`
 *  (see `computeSavingsFundFlows`). Deposits are the `savings` transactions. */
export interface SavingsFundConfig {
  /** Display name, e.g. "Ahorros". */
  name: string;
  /** Fund balance at the start of `openingMonth`. */
  openingBalance: number;
  /** YYYY-MM. Set once on creation, never changed by later edits. */
  openingMonth: string;
}
