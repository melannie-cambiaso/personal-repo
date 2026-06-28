import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loadEntries, loadGoals } from "@/features/savings/data";
import { loadForecastConfig } from "@/features/savings/data/kvAdapter";
import { handleSave, handleSaveGoals, handleSaveForecastConfig } from "@/features/savings/data/savingsActions";
import { computeSuggestedIncome } from "@/features/savings/domain/computeSuggestedIncome";
import { SavingsScreen } from "@/features/savings/presentation/screens/Dashboard/SavingsScreen";

export default async function SavingsPage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const [initialEntries, initialGoals, initialForecastConfig] = await Promise.all([
    loadEntries(),
    loadGoals(),
    loadForecastConfig(),
  ]);

  const suggestedIncome = computeSuggestedIncome(initialEntries);

  return (
    <SavingsScreen
      initialEntries={initialEntries}
      initialGoals={initialGoals}
      isOwner={isOwner}
      onSave={handleSave}
      onSaveGoals={handleSaveGoals}
      initialForecastConfig={initialForecastConfig}
      suggestedIncome={suggestedIncome}
      onSaveForecastConfig={handleSaveForecastConfig}
    />
  );
}
