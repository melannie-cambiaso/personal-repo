# Design: Monthly breakdown of savings deposits and expenses

## Technical Approach

Add one pure domain function `groupEntriesByMonth` under `features/savings/domain/`, structurally
mirroring `features/finance/domain/groupTransactionsByDay.ts` (Map-bucket → per-bucket reduce →
sort). It buckets entries by `entry.date.slice(0, 7)` ("YYYY-MM"), sums `deposito`/`gasto` amounts
per bucket, and returns `MonthlySavingsGroup[]` sorted newest-first. Presentation adds a third tab
`"Por mes"` to `SavingsScreen.tsx` whose panel renders `groupEntriesByMonth(entries)` as one card per
month (Depositado / Gastado / Neto via `formatCLP`, header via `formatMonth`), inside a new
`MonthlyBreakdown/` component folder. Purely additive and derivation-only — no data, storage, or
`SavingsEntry` changes.

## Architecture Decisions

### Decision: Month key via `entry.date.slice(0, 7)`, not a `Date`-based helper

**Choice**: derive the bucket key with a trivial string slice.
**Alternatives considered**: replicate the sibling's `localDateKey(new Date(...))` with
`getFullYear()`/`getMonth()`.
**Rationale**: `SavingsEntry.date` is already a canonical `"YYYY-MM-DD"` string (unlike
`FinanceTransaction.createdAt`, an ISO timestamp). Slicing avoids `Date` construction and the
timezone off-by-one it introduces. This is the one deliberate deviation from the sibling; the
Map-bucket + sort skeleton is otherwise identical.

### Decision: Sort groups descending (newest month first)

**Choice**: `groups.sort((a, b) => b.month.localeCompare(a.month))`.
**Rationale**: matches the reverse-chronological "Historial" list and the "ver cómo he ido"
retrospective intent. `"YYYY-MM"` sorts lexicographically == chronologically. Entries inside each
bucket are also sorted `date` desc, mirroring the sibling's intra-bucket sort.

### Decision: Presentation-only component with no local state

**Choice**: a single presentational `MonthlyBreakdown` component that receives `entries` and calls
the domain function internally; no hook, no store, no `useState`.
**Alternatives considered**: a `useMonthlyBreakdown` hook; passing pre-grouped data from the screen.
**Rationale**: grouping is a cheap pure derivation over already-loaded data (dozens–hundreds of
entries). A hook would add indirection for zero shared state. Keeps the change confined and testable
as a plain render.

### Decision: Empty-state guard in the component

**Choice**: when `groups.length === 0`, render a short "Sin registros" placeholder rather than an
empty div.
**Rationale**: the tab is reachable with zero entries; the domain function returns `[]` cleanly and
the component owns the empty UX, consistent with the app's other lists.

## Data Flow

    SavingsScreen (entries)
        │  activeTab === "monthly"
        ▼
    <MonthlyBreakdown entries={entries} />
        │  groupEntriesByMonth(entries)  ── pure domain
        ▼
    MonthlySavingsGroup[]  ──→  one card / month (formatMonth header, formatCLP totals)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `features/savings/domain/groupEntriesByMonth.ts` | Create | `MonthlySavingsGroup` interface + pure `groupEntriesByMonth()` |
| `features/savings/domain/groupEntriesByMonth.test.ts` | Create | Vitest unit tests (bucketing, totals, net, sort, empty) |
| `features/savings/domain/index.ts` | Modify | `export { groupEntriesByMonth }` + `export type { MonthlySavingsGroup }` |
| `features/savings/presentation/components/MonthlyBreakdown/MonthlyBreakdown.tsx` | Create | Presentational list: maps groups → month cards |
| `features/savings/presentation/components/index.ts` | Modify | `export { MonthlyBreakdown } from "./MonthlyBreakdown/MonthlyBreakdown"` |
| `features/savings/presentation/screens/Dashboard/SavingsScreen.tsx` | Modify | Widen `activeTab` union, add "Por mes" tab button + panel |

## Interfaces / Contracts

```ts
// features/savings/domain/groupEntriesByMonth.ts
import type { SavingsEntry } from "./SavingsEntry";

export interface MonthlySavingsGroup {
  month: string;          // "YYYY-MM" — sort/identity key
  totalDepositos: number; // Σ "deposito" amounts in the month
  totalGastos: number;    // Σ "gasto" amounts in the month
  net: number;            // totalDepositos − totalGastos
  entries: SavingsEntry[];
}

export function groupEntriesByMonth(entries: SavingsEntry[]): MonthlySavingsGroup[];
```

```ts
// MonthlyBreakdown.tsx
interface Props { entries: SavingsEntry[] }
```

### Integration point in `SavingsScreen.tsx`

- Line 56: `useState<"history" | "goals">("history")` → `useState<"history" | "goals" | "monthly">("history")`.
- After the "Metas" tab button (line ~93): add a third `<button onClick={() => setActiveTab("monthly")}>Por mes</button>`, same className pattern keyed on `activeTab === "monthly"`.
- After the `activeTab === "goals"` panel (line ~142): add `{activeTab === "monthly" && <MonthlyBreakdown entries={entries} />}`.
- Add `MonthlyBreakdown` to the existing `../../components` import (line 9–19).

## Testing Strategy (Strict TDD — RED→GREEN)

### Cycle 1 — domain unit (`groupEntriesByMonth.test.ts`)

Mirror `computeBalance.test.ts` style (`entry(overrides)` factory, relative import). Cases:
1. **RED** empty array → `[]`.
2. Single month, mixed → one group, correct `totalDepositos`, `totalGastos`, `net`.
3. Multiple months → sorted newest-first by `month`.
4. Month key derived from `date` (not `createdAt`) — entry with `date: "2026-05-31"`,
   `createdAt` in a different month, buckets under `"2026-05"`.
5. `gasto`-only month → `totalDepositos: 0`, negative `net`; `entries` preserved.
**GREEN**: implement function + add the two barrel exports.

### Cycle 2 — presentation integration (`MonthlyBreakdown.test.tsx`)

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | Renders one card per month, newest first | RTL render with 2-month fixture, assert order |
| Integration | Shows Depositado/Gastado/Neto via `formatCLP` and `formatMonth` header | `getByText` on formatted values |
| Integration | Empty entries → "Sin registros" placeholder | render `[]` |

(Optional light screen test that clicking "Por mes" swaps panels — only if sibling tabs already have one; otherwise covered by the component test.)

## Migration / Rollout

No migration. Purely additive. Rollback: delete `groupEntriesByMonth.{ts,test.ts}` and
`MonthlyBreakdown/`, revert the two barrel/index exports and the three `SavingsScreen.tsx` edits.

## Review Workload Forecast

| Item | Est. changed lines |
|------|--------------------|
| `groupEntriesByMonth.ts` (new) | ~28 |
| `groupEntriesByMonth.test.ts` (new) | ~60 |
| `domain/index.ts` (2 exports) | ~2 |
| `MonthlyBreakdown.tsx` (new) | ~45 |
| `MonthlyBreakdown.test.tsx` (new) | ~55 |
| `components/index.ts` (1 export) | ~1 |
| `SavingsScreen.tsx` (union + button + panel + import) | ~12 |
| **Total** | **~200** |

`Decision needed before apply: No`
`Chained PRs recommended: No`
`400-line budget risk: Low`

~200 lines, single feature slice, no schema/data surface, `features/finance/` untouched. Single PR;
the size guard does not trip.

## Open Questions

None — both framing items (tab label "Por mes", full-list view) were resolved in the proposal.
