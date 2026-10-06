import type { BudgetConfig } from "../BudgetConfig";
import type { BudgetVersion } from "../budgetVersions";

/**
 * Port: the contract the domain requires for budget persistence.
 *
 * Declared here (in the domain) so the domain owns the shape it needs,
 * not the infrastructure. Any adapter (Redis, Postgres, in-memory) must
 * satisfy this interface — the domain never imports the adapter directly.
 */
export interface IBudgetRepository {
  /**
   * Returns all stored budget versions, ordered by `effectiveFrom`.
   * Returns an empty array (not an error) when nothing has been persisted yet —
   * every month then resolves to `DEFAULT_BUDGET_CONFIG`.
   */
  loadVersions(): Promise<BudgetVersion[]>;

  /**
   * Persists the budget config effective from `month`, leaving every other
   * version intact. `month` must be a valid YYYY-MM string; enforcement is
   * the caller's responsibility (see `handleSaveBudgetVersion`).
   */
  saveVersion(month: string, config: BudgetConfig): Promise<void>;
}
