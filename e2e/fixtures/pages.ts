/** Every page behind the login, with each sidebar section as a separate entry. */
export const PAGES = [
  { name: "inicio", path: "/" },
  { name: "finanzas-presupuesto", path: "/finance-v2" },
  { name: "finanzas-resumen", path: "/finance-v2?section=summary" },
  { name: "finanzas-movimientos", path: "/finance-v2?section=movements" },
  { name: "finanzas-analisis", path: "/finance-v2?section=analysis" },
  { name: "ahorros-historial", path: "/savings" },
  { name: "ahorros-metas", path: "/savings?section=goals" },
  { name: "ahorros-por-mes", path: "/savings?section=monthly" },
  { name: "ahorros-archivados", path: "/savings?section=archived" },
  { name: "wishlist", path: "/wishlist" },
  { name: "casa", path: "/home-improvements" },
] as const;
