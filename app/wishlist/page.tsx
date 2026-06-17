import {
  loadItems,
  loadOwnedIds,
  saveItems,
  saveOwnedIds,
} from "@/features/wishlist/data/kvAdapter";
import { WishlistItem } from "@/features/wishlist/domain";
import DashboardScreen from "@/features/wishlist/presentation/screens/Dashboard/DashboardScreen";

async function handleAdd(items: WishlistItem[]) {
  "use server";
  await saveItems(items);
}

async function handleToggle(ids: string[]) {
  "use server";
  await saveOwnedIds(new Set(ids));
}

export default async function WishlistPage() {
  const [items, ownedIds] = await Promise.all([loadItems(), loadOwnedIds()]);

  return (
    <DashboardScreen
      initialItems={items}
      initialOwnedIds={[...ownedIds]}
      onAdd={handleAdd}
      onToggle={handleToggle}
    />
  );
}
