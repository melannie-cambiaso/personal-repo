export interface FeatureNavItem {
  href: string;
  label: string;
  icon: string;
}

export const FEATURE_NAV_ITEMS: FeatureNavItem[] = [
  { href: "/finance", label: "Finanzas", icon: "💸" },
  { href: "/home-improvements", label: "Casa", icon: "🏠" },
  { href: "/savings", label: "Ahorros", icon: "💰" },
  { href: "/shopping-list", label: "Compras", icon: "🛒" },
  { href: "/todo", label: "To-Do", icon: "✅" },
  { href: "/wishlist", label: "Wishlist", icon: "🛍️" },
];
