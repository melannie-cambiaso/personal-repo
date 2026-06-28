import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loadEntries } from "@/features/activity-log/data/kvAdapter";
import { ActivityLogScreen } from "@/features/activity-log/presentation/screens/Dashboard/ActivityLogScreen";

export default async function ActivityLogPage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const initialEntries = await loadEntries(currentMonth);

  return <ActivityLogScreen initialEntries={initialEntries} />;
}
