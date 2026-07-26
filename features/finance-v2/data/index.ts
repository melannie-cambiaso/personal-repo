// Mirrors features/finance/data/index.ts: barrel exposes the direct kvAdapter loaders
// (consumed by the RSC page after its own cookie gate) plus the auth-gated save actions
// (consumed by the client hooks). The RSC uses `loadDashboardConfig`/`loadBudgetConfig`/
// `loadTransactions` directly, same as v1's `loadBudget` — there is no separate auth-gated
// read action for any of them, since the page-level redirect already gates access before
// the loader runs.
export { loadDashboardConfig, loadBudgetConfig, loadTransactions } from "./kvAdapter";
export {
  handleSaveDashboardConfig,
  handleSaveBudgetConfig,
  handleSaveTransactions,
  handleAppendTransactionToMonth,
} from "./financeV2Actions";
