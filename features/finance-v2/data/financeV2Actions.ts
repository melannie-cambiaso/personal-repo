"use server";

import { cookies } from "next/headers";
import type { FinanceV2Config, BudgetConfig } from "@/features/finance-v2/domain";
import { saveDashboardConfig, saveBudgetConfig } from "./kvAdapter";

export async function handleSaveDashboardConfig(config: FinanceV2Config): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveDashboardConfig(config);
}

export async function handleSaveBudgetConfig(config: BudgetConfig): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveBudgetConfig(config);
}
