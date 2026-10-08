import type { BucketKey } from "./BucketKey";
import type { BudgetConfig, BudgetFrequency } from "./BudgetConfig";
import type { Weekday } from "@/shared/utils/monthUtils";

/** Pure tree edits over `BudgetConfig`. Callers supply ids (e.g.
 *  `crypto.randomUUID()`) so this module stays side-effect free. Every
 *  function returns a new `BudgetConfig`; the input is never mutated. */

export function addCategory(
  config: BudgetConfig,
  args: { id: string; name: string; bucket: BucketKey }
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
  args: { categoryId: string; id: string; name: string; bucket: BucketKey }
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
        : category
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
  args: { categoryId: string; id: string }
): BudgetConfig {
  return {
    categories: config.categories.map((category) =>
      category.id === args.categoryId
        ? {
            ...category,
            subcategories: category.subcategories.filter((sub) => sub.id !== args.id),
          }
        : category
    ),
  };
}

/** Sets a leaf's amount: the category's own amount when `subcategoryId` is
 *  `null`, or a subcategory's amount when `subcategoryId` is provided.
 *  Unknown ids leave the config unchanged (no throw). */
export function setLeafAmount(
  config: BudgetConfig,
  args: { categoryId: string; subcategoryId: string | null; amount: number }
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
          sub.id === args.subcategoryId ? { ...sub, amount: args.amount } : sub
        ),
      };
    }),
  };
}

/** Sets a leaf's frequency: the category's own frequency when
 *  `subcategoryId` is `null`, or a subcategory's frequency when
 *  `subcategoryId` is provided. Unknown ids leave the config unchanged (no
 *  throw) — mirrors `setLeafAmount`. The amount itself is untouched: a leaf
 *  switching frequency keeps its raw `amount` figure, only its MEANING (per
 *  month vs. per week) changes, resolved later by `resolveLeafMonthlyAmount`. */
export function setLeafFrequency(
  config: BudgetConfig,
  args: { categoryId: string; subcategoryId: string | null; frequency: BudgetFrequency }
): BudgetConfig {
  return {
    categories: config.categories.map((category) => {
      if (category.id !== args.categoryId) return category;

      if (args.subcategoryId === null) {
        return { ...category, frequency: args.frequency };
      }

      return {
        ...category,
        subcategories: category.subcategories.map((sub) =>
          sub.id === args.subcategoryId ? { ...sub, frequency: args.frequency } : sub
        ),
      };
    }),
  };
}

/** Renames a category. Unknown ids leave the config unchanged (no throw). */
export function renameCategory(
  config: BudgetConfig,
  args: { categoryId: string; name: string }
): BudgetConfig {
  return {
    categories: config.categories.map((category) =>
      category.id === args.categoryId ? { ...category, name: args.name } : category
    ),
  };
}

/** Renames a subcategory inside the given category. Unknown ids leave the
 *  config unchanged (no throw) — mirrors `renameCategory`. */
export function renameSubcategory(
  config: BudgetConfig,
  args: { categoryId: string; id: string; name: string }
): BudgetConfig {
  return {
    categories: config.categories.map((category) =>
      category.id === args.categoryId
        ? {
            ...category,
            subcategories: category.subcategories.map((sub) =>
              sub.id === args.id ? { ...sub, name: args.name } : sub
            ),
          }
        : category
    ),
  };
}

/** Sets the weekday a weekly leaf recurs on: the category's own weekday when
 *  `subcategoryId` is `null`, or a subcategory's when provided. Unknown ids
 *  leave the config unchanged (no throw) — mirrors `setLeafFrequency`. Amount
 *  and frequency are untouched; the weekday only changes how many weeks the
 *  leaf counts per month (see `resolveLeafWeeks`). */
export function setLeafWeekday(
  config: BudgetConfig,
  args: { categoryId: string; subcategoryId: string | null; weekday: Weekday }
): BudgetConfig {
  return {
    categories: config.categories.map((category) => {
      if (category.id !== args.categoryId) return category;

      if (args.subcategoryId === null) {
        return { ...category, weekday: args.weekday };
      }

      return {
        ...category,
        subcategories: category.subcategories.map((sub) =>
          sub.id === args.subcategoryId ? { ...sub, weekday: args.weekday } : sub
        ),
      };
    }),
  };
}
