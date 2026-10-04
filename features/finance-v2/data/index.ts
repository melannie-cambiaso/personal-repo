// Barrel exposing the direct server-side loaders
// (consumed by the RSC page after its own cookie gate) plus the auth-gated actions
// (consumed by the client hooks). The RSC uses `loadBudgetConfig`/`loadTransactions`/
// `loadEnvelopeConfig`/`loadEnvelopeCarriedBalance` directly —
// the page-level redirect already gates access before those loaders run. The two
// `handleLoad*` actions are the exception: the client hooks call them directly on every
// month change, so they are POST-reachable on their own and gate auth themselves.
export { loadBudgetConfig, loadTransactions, loadEnvelopeConfig } from "./kvAdapter";
export { loadEnvelopeCarriedBalance } from "./envelopeCarriedBalance";
export { loadHomeFinanceSummary } from "./homeFinanceSummary";
export type { HomeFinanceSummary } from "./homeFinanceSummary";
export {
  handleSaveBudgetConfig,
  handleSaveTransactions,
  handleAppendTransactionToMonth,
  handleLoadTransactions,
  handleSaveEnvelopeConfig,
  handleLoadEnvelopeCarriedBalance,
} from "./financeV2Actions";
