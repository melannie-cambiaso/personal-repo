import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loadEntries, loadGoals } from "@/features/savings/data";
import { handleSave, handleSaveGoals } from "@/features/savings/data/savingsActions";
import { SavingsScreen } from "@/features/savings/presentation/screens/Dashboard/SavingsScreen";

export default async function SavingsPage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const [initialEntries, initialGoals] = await Promise.all([loadEntries(), loadGoals()]);

  return (
    <SavingsScreen
      initialEntries={initialEntries}
      initialGoals={initialGoals}
      isOwner={isOwner}
      onSave={handleSave}
      onSaveGoals={handleSaveGoals}
    />
  );
}
