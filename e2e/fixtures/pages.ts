/** Every page behind the login, with the Finanzas v2 sections as separate entries. */
export const PAGES = [
  { name: "inicio", path: "/" },
  { name: "finanzas-presupuesto", path: "/finance-v2" },
  { name: "finanzas-movimientos", path: "/finance-v2?section=movements" },
  { name: "finanzas-analisis", path: "/finance-v2?section=analysis" },
  { name: "ahorros", path: "/savings" },
  { name: "wishlist", path: "/wishlist" },
  { name: "casa", path: "/home-improvements" },
] as const;
