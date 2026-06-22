import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loadEntries, loadBudget } from "@/features/finance/data";
import { handleSave, handleSaveBudget } from "@/features/finance/data/financeActions";
import { FinanceScreen } from "@/features/finance/presentation/screens/Dashboard/FinanceScreen";

export default async function FinancePage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [initialEntries, initialBudget] = await Promise.all([loadEntries(), loadBudget(currentMonth)]);

  return (
    <FinanceScreen
      initialEntries={initialEntries}
      initialBudget={initialBudget}
      isOwner={isOwner}
      onSave={handleSave}
      onSaveBudget={handleSaveBudget}
    />
  );
}
