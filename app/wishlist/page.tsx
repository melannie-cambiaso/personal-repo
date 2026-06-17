import {
  loadItems,
  loadOwnedIds,
  saveItems,
  saveOwnedIds,
} from "@/features/wishlist/data/kvAdapter";
import { WishlistItem } from "@/features/wishlist/domain";
import DashboardScreen from "@/features/wishlist/presentation/screens/Dashboard/DashboardScreen";
import { cookies } from "next/headers";

async function handleAdd(items: WishlistItem[]) {
  "use server";
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveItems(items);
}

async function handleToggle(ids: string[]) {
  "use server";
  await saveOwnedIds(new Set(ids));
}

export default async function WishlistPage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  const [items, ownedIds] = await Promise.all([loadItems(), loadOwnedIds()]);

  return (
    <DashboardScreen
      initialItems={items}
      initialOwnedIds={[...ownedIds]}
      isOwner={isOwner}
      onAdd={handleAdd}
      onToggle={handleToggle}
    />
  );
}
