import {
  loadItems,
  loadOwnedIds,
  saveItems,
  saveOwnedIds,
} from "@/features/wishlist/data/kvAdapter";
import { WishlistItem } from "@/features/wishlist/domain";
import DashboardScreen from "@/features/wishlist/presentation/screens/Dashboard/DashboardScreen";
import { cookies } from "next/headers";
import { isAuthorized } from "@/shared/auth";

async function handleAdd(items: WishlistItem[]) {
  "use server";
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) return;
  await saveItems(items);
}

// A server action is reachable on its own, outside the proxy-guarded page, so it
// checks the auth cookie itself, like `handleAdd`.
async function handleToggle(ids: string[]) {
  "use server";
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) return;
  await saveOwnedIds(new Set(ids));
}

export default async function WishlistPage() {
  const cookieStore = await cookies();
  const isOwner = isAuthorized(cookieStore);
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
