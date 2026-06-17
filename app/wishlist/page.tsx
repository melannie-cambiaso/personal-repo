import { loadItems, loadOwnedIds, saveItems } from "@/features/wishlist/data/kvAdapter";
import { WishlistItem } from "@/features/wishlist/domain";
import DashboardScreen from "@/features/wishlist/presentation/screens/Dashboard/DashboardScreen";
import { cookies } from "next/headers";

async function handleAdd(items: WishlistItem[]) {
  "use server";

  await saveItems(items);
}

export default async function WishlistPage() {
  const cookieStore = await cookies();
  const isOwner = cookieStore.get("wishlist_auth")?.value;
  console.log(isOwner);
  const [items, ownerIds] = await Promise.all([loadItems(), loadOwnedIds()]);

  return <DashboardScreen initialItems={items} onAdd={handleAdd} />;
}
