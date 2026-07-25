import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loadDashboardConfig, handleSaveDashboardConfig } from "@/features/finance-v2/data";
import { FinanceV2Screen } from "@/features/finance-v2/presentation/screens/Dashboard/FinanceV2Screen";

export default async function FinanceV2Page() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const initialConfig = await loadDashboardConfig();

  return <FinanceV2Screen initialConfig={initialConfig} onSave={handleSaveDashboardConfig} />;
}
