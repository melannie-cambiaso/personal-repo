import type { ExpenseBucketKey } from "./FinanceV2Transaction";
import type { ExpenseCategoryOption } from "./expenseCategoryOptions";
import type { SpendRow } from "./spendRollup";
import type { PendingOverrides } from "./pendingOverrides";
import { clampAmount } from "./clamp";

export interface PendingRow {
  id: string;
  name: string;
  bucket: ExpenseBucketKey;
  /** clampAmount(budgeted - spent) — the fallback when no override exists. */
  computed: number;
  /** clampAmount(override ?? computed) — the DISPLAYED/persisted value. */
  amount: number;
  isOverridden: boolean;
}

export interface PendingView {
  rows: PendingRow[];
  total: number;
}

/** Leaf set comes from `options` (D1), NOT from `leaves` or `overrides` keys —
 *  `options` already excludes `bucket:"savings"` leaves and only ever contains
 *  leaves currently in `BudgetConfig`, so a savings leaf can never appear here
 *  and an override for a deleted leaf is structurally never looked up
 *  (Orphaned Override Inertness). Rows sorted by name so presentation stays
 *  math- and sort-free. `total` sums every leaf (hidden or not), then `rows`
 *  drops the zero-amount ones — a fully paid-off category has nothing left to
 *  act on, so it's noise in the list, but it never silently changes the total. */
export function computePendingView(
  options: ExpenseCategoryOption[],
  leaves: Record<string, SpendRow>,
  overrides: PendingOverrides,
): PendingView {
  const allRows: PendingRow[] = options
    .map((option) => {
      const spend = leaves[option.id] ?? { budgeted: 0, spent: 0 };
      const computed = clampAmount(spend.budgeted - spend.spent);
      const override = overrides[option.id];
      const isOverridden = override !== undefined;
      const amount = clampAmount(isOverridden ? override : computed);

      return { id: option.id, name: option.name, bucket: option.bucket, computed, amount, isOverridden };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const total = allRows.reduce((sum, row) => sum + row.amount, 0);
  const rows = allRows.filter((row) => row.amount !== 0);

  return { rows, total };
}
