// Mirrors features/finance/data/index.ts: barrel exposes the direct kvAdapter loaders
// (consumed by the RSC page after its own cookie gate) plus the auth-gated save actions
// (consumed by the client hooks). The RSC uses `loadDashboardConfig`/`loadBudgetConfig`
// directly, same as v1's `loadBudget` — there is no separate auth-gated read action for
// either config, since the page-level redirect already gates access before the loader runs.
export { loadDashboardConfig, loadBudgetConfig } from "./kvAdapter";
export { handleSaveDashboardConfig, handleSaveBudgetConfig } from "./financeV2Actions";
