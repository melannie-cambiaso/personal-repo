import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loadEntries } from "@/features/savings/data";
import { handleSave } from "@/features/savings/data/savingsActions";
import { SavingsScreen } from "@/features/savings/presentation/screens/Dashboard/SavingsScreen";

export default async function SavingsPage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const initialEntries = await loadEntries();

  return (
    <SavingsScreen
      initialEntries={initialEntries}
      isOwner={isOwner}
      onSave={handleSave}
    />
  );
}
