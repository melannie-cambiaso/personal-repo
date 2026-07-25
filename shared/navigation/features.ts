export interface FeatureNavItem {
  href: string;
  label: string;
  icon: string;
  subtitle: string;
}

export const FEATURE_NAV_ITEMS: FeatureNavItem[] = [
  { href: "/finance", label: "Finanzas", icon: "💸", subtitle: "Presupuesto mensual" },
  { href: "/finance-v2", label: "Finanzas v2", icon: "🧮", subtitle: "Split de ingresos" },
  { href: "/home-improvements", label: "Casa", icon: "🏠", subtitle: "Mejoras del hogar" },
  { href: "/savings", label: "Ahorros", icon: "💰", subtitle: "Tu registro financiero" },
  { href: "/shopping-list", label: "Compras", icon: "🛒", subtitle: "Listas por categoría" },
  { href: "/todo", label: "To-Do", icon: "✅", subtitle: "Tus tareas pendientes" },
  { href: "/wishlist", label: "Wishlist", icon: "🛍️", subtitle: "Tus cosas deseadas" },
];
