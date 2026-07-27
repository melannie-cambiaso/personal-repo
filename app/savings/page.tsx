import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loadEntries, loadGoals, loadPeriods } from "@/features/savings/data";
import {
  handleSave,
  handleSaveGoals,
  handleArchiveAndStartPeriod,
} from "@/features/savings/data/savingsActions";
import { resolveActivePeriod, selectPeriodEntries } from "@/features/savings/domain/SavingsPeriod";
import { SavingsScreen } from "@/features/savings/presentation/screens/Dashboard/SavingsScreen";

export default async function SavingsPage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const [entries, initialGoals, periods] = await Promise.all([
    loadEntries(),
    loadGoals(),
    loadPeriods(),
  ]);

  const activePeriod = resolveActivePeriod(periods);
  const activeEntries = selectPeriodEntries(entries, activePeriod.id);

  return (
    <SavingsScreen
      initialEntries={activeEntries}
      initialGoals={initialGoals}
      isOwner={isOwner}
      onSave={handleSave}
      onSaveGoals={handleSaveGoals}
      period={activePeriod}
      periods={periods}
      allEntries={entries}
      onArchive={handleArchiveAndStartPeriod}
    />
  );
}
