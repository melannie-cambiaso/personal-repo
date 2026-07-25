import "server-only";
import { redis } from "@/shared/kv";
import { DEFAULT_FINANCE_V2_CONFIG } from "@/features/finance-v2/domain";
import type { FinanceV2Config } from "@/features/finance-v2/domain";

// Global, not month-scoped — mirrors finance/data/kvAdapter.ts's CATEGORY_NOTES_KEY: one
// shared config across every month, distinct from all v1 finance keys.
const DASHBOARD_CONFIG_KEY = "finance-v2-dashboard-config";

export async function loadDashboardConfig(): Promise<FinanceV2Config> {
  try {
    return (await redis.get<FinanceV2Config>(DASHBOARD_CONFIG_KEY)) ?? DEFAULT_FINANCE_V2_CONFIG;
  } catch {
    return DEFAULT_FINANCE_V2_CONFIG;
  }
}

export async function saveDashboardConfig(config: FinanceV2Config): Promise<void> {
  try {
    await redis.set(DASHBOARD_CONFIG_KEY, config);
  } catch {
    // ponytail: swallow — caller has no recovery path; config reverts to in-memory state on next load
  }
}
