import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  loadBudget,
  loadTransactions,
  loadCategories,
  loadClosedCategories,
} from "@/features/finance/data";
import { handleSaveBudget } from "@/features/finance/data/financeActions";
import { FinanceScreen } from "@/features/finance/presentation/screens/Dashboard/FinanceScreen";

export default async function FinancePage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [initialBudget, initialTransactions, initialCategories, initialClosedCategories] =
    await Promise.all([
      loadBudget(currentMonth),
      loadTransactions(currentMonth),
      loadCategories(),
      loadClosedCategories(currentMonth),
    ]);

  return (
    <FinanceScreen
      initialBudget={initialBudget}
      initialTransactions={initialTransactions}
      initialCategories={initialCategories}
      initialClosedCategories={initialClosedCategories}
      onSaveBudget={handleSaveBudget}
    />
  );
}
