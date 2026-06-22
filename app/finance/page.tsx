import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loadEntries } from "@/features/finance/data";
import { handleSave } from "@/features/finance/data/financeActions";
import { FinanceScreen } from "@/features/finance/presentation/screens/Dashboard/FinanceScreen";

export default async function FinancePage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const initialEntries = await loadEntries();

  return (
    <FinanceScreen
      initialEntries={initialEntries}
      isOwner={isOwner}
      onSave={handleSave}
    />
  );
}
