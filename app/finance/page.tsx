import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loadBudget, loadActual, loadCategories } from "@/features/finance/data";
import { handleSaveBudget, handleSaveActual } from "@/features/finance/data/financeActions";
import { FinanceScreen } from "@/features/finance/presentation/screens/Dashboard/FinanceScreen";

export default async function FinancePage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [initialBudget, initialActual, initialCategories] = await Promise.all([
    loadBudget(currentMonth),
    loadActual(currentMonth),
    loadCategories(),
  ]);

  return (
    <FinanceScreen
      initialBudget={initialBudget}
      initialActual={initialActual}
      initialCategories={initialCategories}
      onSaveBudget={handleSaveBudget}
      onSaveActual={handleSaveActual}
    />
  );
}
