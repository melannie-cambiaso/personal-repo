import type { Category } from "./Category";

export interface WishlistItem {
  id: string;
  category: Category;
  emoji: string;
  image?: string;
  brand: string;
  title: string;
  description: string;
  tag?: string;
  price: number | null;
  owned: boolean;
  url?: string;
}
