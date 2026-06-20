import { loadItems, loadZones, saveItems, saveZones } from "@/features/home-improvements/data";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import { HomeImprovementsScreen } from "@/features/home-improvements/presentation/screens/Dashboard/HomeImprovementsScreen";
import { cookies } from "next/headers";

async function handleSaveZones(zones: Zone[]) {
  "use server";
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveZones(zones);
}

async function handleSaveItems(items: ImprovementItem[]) {
  "use server";
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveItems(items);
}

export default async function HomeImprovementsPage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  const [zones, items] = await Promise.all([loadZones(), loadItems()]);

  return (
    <HomeImprovementsScreen
      initialZones={zones}
      initialItems={items}
      isOwner={isOwner}
      onSaveZones={handleSaveZones}
      onSaveItems={handleSaveItems}
    />
  );
}
