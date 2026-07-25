// Mirrors features/finance/data/index.ts: barrel exposes the direct kvAdapter loader
// (consumed by the RSC page after its own cookie gate) plus the auth-gated save action
// (consumed by the client hook). The RSC uses `loadDashboardConfig` directly, same as
// v1's `loadBudget` — there is no separate auth-gated read action, since the page-level
// redirect already gates access before the loader runs.
export { loadDashboardConfig } from "./kvAdapter";
export { handleSaveDashboardConfig } from "./financeV2Actions";
