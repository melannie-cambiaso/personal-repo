/** Search param that selects a feature's section (its sub-level in the app menu). */
export const SECTION_PARAM = "section";

export interface FeatureNavSection<K extends string = string> {
  key: K;
  label: string;
  icon: string;
}

export interface FeatureNavItem {
  href: string;
  label: string;
  icon: string;
  subtitle: string;
  /** Sub-levels shown under the feature in the app menu; the first one is the default. */
  sections?: readonly FeatureNavSection[];
}

export const FINANCE_V2_SECTIONS = [
  { key: "budget", label: "Presupuesto", icon: "🧾" },
  { key: "movements", label: "Movimientos", icon: "💸" },
  { key: "analysis", label: "Análisis", icon: "📊" },
] as const satisfies readonly FeatureNavSection[];

export type FinanceV2SectionKey = (typeof FINANCE_V2_SECTIONS)[number]["key"];

export const SAVINGS_SECTIONS = [
  { key: "history", label: "Historial", icon: "📜" },
  { key: "goals", label: "Metas", icon: "🎯" },
  { key: "monthly", label: "Por mes", icon: "🗓️" },
  { key: "archived", label: "Archivados", icon: "🗄️" },
] as const satisfies readonly FeatureNavSection[];

/** The section a raw param names, or the first section when it is missing or unknown. */
export function resolveSection<K extends string>(
  sections: readonly FeatureNavSection<K>[],
  raw: string | null
): K {
  return sections.find((s) => s.key === raw)?.key ?? sections[0].key;
}

export const FEATURE_NAV_ITEMS: FeatureNavItem[] = [
  {
    href: "/finance-v2",
    label: "Finanzas v2",
    icon: "🧮",
    subtitle: "Split de ingresos",
    sections: FINANCE_V2_SECTIONS,
  },
  { href: "/home-improvements", label: "Casa", icon: "🏠", subtitle: "Mejoras del hogar" },
  {
    href: "/savings",
    label: "Ahorros",
    icon: "💰",
    subtitle: "Tu registro financiero",
    sections: SAVINGS_SECTIONS,
  },
  { href: "/wishlist", label: "Wishlist", icon: "🛍️", subtitle: "Tus cosas deseadas" },
];
