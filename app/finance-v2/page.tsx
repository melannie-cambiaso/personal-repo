import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  loadBudgetConfig,
  handleSaveBudgetConfig,
  loadTransactions,
  handleSaveTransactions,
  handleAppendTransactionToMonth,
  handleLoadTransactions,
} from "@/features/finance-v2/data";
import { FinanceV2Screen } from "@/features/finance-v2/presentation/screens/Dashboard/FinanceV2Screen";
import { currentMonth } from "@/shared/utils/monthUtils";

export default async function FinanceV2Page() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const month = currentMonth();

  const [initialBudget, initialTransactions] = await Promise.all([
    loadBudgetConfig(),
    loadTransactions(month),
  ]);

  return (
    <FinanceV2Screen
      initialBudget={initialBudget}
      onSaveBudget={handleSaveBudgetConfig}
      initialTransactions={initialTransactions}
      initialMonth={month}
      onSaveTransactions={handleSaveTransactions}
      onSaveToOtherMonth={handleAppendTransactionToMonth}
      onLoadTransactions={handleLoadTransactions}
    />
  );
}
