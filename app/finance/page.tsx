import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loadEntries, loadBudget } from "@/features/finance/data";
import { handleSave, handleSaveBudget } from "@/features/finance/data/financeActions";
import { FinanceScreen } from "@/features/finance/presentation/screens/Dashboard/FinanceScreen";

export default async function FinancePage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const [initialEntries, initialBudget] = await Promise.all([loadEntries(), loadBudget()]);

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
