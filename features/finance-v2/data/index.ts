// Mirrors features/finance/data/index.ts: barrel exposes the direct kvAdapter loaders
// (consumed by the RSC page after its own cookie gate) plus the auth-gated save actions
// (consumed by the client hooks). The RSC uses `loadBudgetConfig`/`loadTransactions`
// directly, same as v1's `loadBudget` — there is no separate auth-gated read action for
// either of those two, since the page-level redirect already gates access before the
// loader runs. `handleLoadTransactions` is the exception: the client hook calls it
// directly on every month change, so it is POST-reachable on its own and gates auth
// itself.
export { loadBudgetConfig, loadTransactions } from "./kvAdapter";
export {
  handleSaveBudgetConfig,
  handleSaveTransactions,
  handleAppendTransactionToMonth,
  handleLoadTransactions,
} from "./financeV2Actions";
