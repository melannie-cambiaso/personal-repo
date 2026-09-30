/** The single, optional, global "envelope": a separate account funded by
 *  `transfer` transactions from the main account that pays every expense of
 *  one bound budget category (see `resolvePaidFrom`). Stored as
 *  `EnvelopeConfig | null`; `null` means the feature is off and finance-v2
 *  behaves exactly as before it existed. Its balance is NEVER stored — it is
 *  always derived from `openingBalance` plus the transactions since
 *  `openingMonth` (see `computeEnvelopeFlows`). */
export interface EnvelopeConfig {
  /** Display name, e.g. "Servicios". */
  name: string;
  /** Id of a TOP-LEVEL `BudgetCategory` (e.g. "Cuentas"). An id, never a
   *  name, so renaming the category does not unbind it. */
  boundCategoryId: string;
  /** Envelope balance at the start of `openingMonth`. Already reflects every
   *  bill paid before the envelope existed (legacy expenses are never stamped). */
  openingBalance: number;
  /** YYYY-MM. Set once on creation, never changed by later edits. */
  openingMonth: string;
}
