import { cookies } from "next/headers";
import { loadCategories, loadItems } from "@/features/shopping-list/data";
import { handleSaveCategories, handleSaveItems } from "@/features/shopping-list/data/shoppingListActions";
import { ShoppingListScreen } from "@/features/shopping-list/presentation/screens/Dashboard/ShoppingListScreen";

export default async function ShoppingListPage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;

  const [initialCategories, initialItems] = await Promise.all([loadCategories(), loadItems()]);

  return (
    <ShoppingListScreen
      initialCategories={initialCategories}
      initialItems={initialItems}
      isOwner={isOwner}
      onSaveCategories={handleSaveCategories}
      onSaveItems={handleSaveItems}
    />
  );
}
