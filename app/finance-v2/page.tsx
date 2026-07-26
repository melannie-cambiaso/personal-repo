import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  loadDashboardConfig,
  handleSaveDashboardConfig,
  loadBudgetConfig,
  handleSaveBudgetConfig,
  loadTransactions,
  handleSaveTransactions,
} from "@/features/finance-v2/data";
import { FinanceV2Screen } from "@/features/finance-v2/presentation/screens/Dashboard/FinanceV2Screen";
import { currentMonth } from "@/shared/utils/monthUtils";

export default async function FinanceV2Page() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const month = currentMonth();

  const [initialConfig, initialBudget, initialTransactions] = await Promise.all([
    loadDashboardConfig(),
    loadBudgetConfig(),
    loadTransactions(month),
  ]);

  return (
    <FinanceV2Screen
      initialConfig={initialConfig}
      onSave={handleSaveDashboardConfig}
      initialBudget={initialBudget}
      onSaveBudget={handleSaveBudgetConfig}
      initialTransactions={initialTransactions}
      month={month}
      onSaveTransactions={handleSaveTransactions}
    />
  );
}
