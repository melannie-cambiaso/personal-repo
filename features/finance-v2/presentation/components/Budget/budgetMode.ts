// Mirrors the existing `components/bucketLabels.ts` constants-module convention.
// Exported here (not from `BudgetTab.tsx`) because `BudgetTab` imports
// `BudgetCategoryCard`; a type export the other way would be an import cycle.
export type BudgetMode = "view" | "edit";

// Label states the ACTION available from the current mode, not the mode's name.
export const BUDGET_MODE_LABEL: Record<BudgetMode, string> = {
  view: "Editar",
  edit: "Listo",
};
