import type { BucketKey } from "./BucketKey";
import type { BudgetConfig } from "./BudgetConfig";

/** Pure tree edits over `BudgetConfig`. Callers supply ids (e.g.
 *  `crypto.randomUUID()`) so this module stays side-effect free. Every
 *  function returns a new `BudgetConfig`; the input is never mutated. */

export function addCategory(
  config: BudgetConfig,
  args: { id: string; name: string; bucket: BucketKey },
): BudgetConfig {
  return {
    categories: [
      ...config.categories,
      { id: args.id, name: args.name, bucket: args.bucket, amount: 0, subcategories: [] },
    ],
  };
}

export function addSubcategory(
  config: BudgetConfig,
  args: { categoryId: string; id: string; name: string; bucket: BucketKey },
): BudgetConfig {
  return {
    categories: config.categories.map((category) =>
      category.id === args.categoryId
        ? {
            ...category,
            subcategories: [
              ...category.subcategories,
              { id: args.id, name: args.name, bucket: args.bucket, amount: 0 },
            ],
          }
        : category,
    ),
  };
}

export function deleteCategory(config: BudgetConfig, categoryId: string): BudgetConfig {
  return {
    categories: config.categories.filter((category) => category.id !== categoryId),
  };
}

export function deleteSubcategory(
  config: BudgetConfig,
  args: { categoryId: string; id: string },
): BudgetConfig {
  return {
    categories: config.categories.map((category) =>
      category.id === args.categoryId
        ? {
            ...category,
            subcategories: category.subcategories.filter((sub) => sub.id !== args.id),
          }
        : category,
    ),
  };
}

/** Sets a leaf's amount: the category's own amount when `subcategoryId` is
 *  `null`, or a subcategory's amount when `subcategoryId` is provided.
 *  Unknown ids leave the config unchanged (no throw). */
export function setLeafAmount(
  config: BudgetConfig,
  args: { categoryId: string; subcategoryId: string | null; amount: number },
): BudgetConfig {
  return {
    categories: config.categories.map((category) => {
      if (category.id !== args.categoryId) return category;

      if (args.subcategoryId === null) {
        return { ...category, amount: args.amount };
      }

      return {
        ...category,
        subcategories: category.subcategories.map((sub) =>
          sub.id === args.subcategoryId ? { ...sub, amount: args.amount } : sub,
        ),
      };
    }),
  };
}
