# Design: Unit-based budget entries (persisted unit config)

Implements **Approach 2** from the proposal: a per-category unit breakdown
(`unitAmount × quantity × factor`) persisted in a new KV key alongside the existing flat
`budget` map, which keeps holding the derived total so every downstream consumer stays untouched.

This design is intentionally additive and minimal (ponytail/YAGNI): one new pure domain function,
one new KV key with a load/save pair, one new server-action pair, and per-category UI wiring in the
component that already owns the flat input. No new abstraction, config layer, or calendar utility.

## Architecture at a glance

```
page.tsx (SSR)
  loadBudget(month) ─────────────► initialBudget      : Record<string, number>   (derived totals)
  loadBudgetUnitConfig(month) ───► initialUnitConfig  : BudgetUnitConfig          (unit breakdowns)
        │
        ▼
FinanceScreen (client state: monthBudget + monthUnitConfig, reloaded together on month change)
        │  onSaveBudget / onSaveUnitConfig
        ▼
BudgetTab (budget + unitConfig state)
        │  GroupSection / CardsSection render, per category:
        │    - no unitConfig[cat]  → today's flat <input>  (unchanged)
        │    - unitConfig[cat]     → 3 unit <input>s + read-only derived total
        ▼
deriveUnitTotal(cfg)  ── pure domain, single source of truth for the total
        │
        ▼
budget[cat] = deriveUnitTotal(cfg)   (recomputed on every unit-field blur and on copy)
```

Data flow contract: **`budget[cat]` is a derived value whenever `unitConfig[cat]` exists.** It is
recomputed from the config on every write; the config is never read by `computeBudgetSummary`,
`computePendingExpenses`, or `buildBudgetExportRows` — they keep reading the flat number.

## 1. Schema — `UnitConfig` / `BudgetUnitConfig`

Lives in a new pure domain file `features/finance/domain/BudgetUnitConfig.ts`, exported through
`features/finance/domain/index.ts` (mirrors how `FinanceTransaction` is defined in domain and
imported by `kvAdapter.ts`). Keeping the type and the derive function in `domain/` makes the only
piece of real logic unit-testable without React or Redis.

```ts
// features/finance/domain/BudgetUnitConfig.ts
export type UnitConfig = {
  unitAmount: number; // manual
  quantity: number;   // manual, default 1  (e.g. "5 Tuesdays this month")
  factor: number;     // manual, default 1  (90% => 0.9)
};

export type BudgetUnitConfig = Record<string /* category */, UnitConfig>;

/** Single source of truth for the derived flat total. CLP has no cents, so we round to an
 *  integer to avoid float drift (e.g. 55000 * 5 * 0.9 = 247500 exactly, but factors like 1/3
 *  would otherwise leak binary-float noise into the stored total). */
export function deriveUnitTotal(cfg: UnitConfig): number {
  return Math.round(cfg.unitAmount * cfg.quantity * cfg.factor);
}

export const DEFAULT_UNIT_CONFIG: Omit<UnitConfig, "unitAmount"> = { quantity: 1, factor: 1 };
```

Rationale for `Math.round`: the flat map is already integer CLP everywhere; rounding at the single
derive point guarantees the "drift" risk in the proposal is closed and keeps
`computeBudgetSummary`/export identical to a hand-entered flat number.

### KV key

`finance-budget-unit-config:${month}` — matches the existing family:
`finance-budget:${month}`, `finance-transactions:${month}`, `finance-closed-categories:${month}`.
The stored value is a `BudgetUnitConfig` (a plain `Record`, JSON-serializable, same shape family as
the flat budget map). Categories not in unit mode simply have no key in this record.

## 2. Persistence wiring — `kvAdapter.ts` + `financeActions.ts`

### `kvAdapter.ts` — new pair, byte-for-byte mirror of `loadBudget`/`saveBudget`

```ts
import type { BudgetUnitConfig } from "@/features/finance/domain";

const budgetUnitConfigKey = (month: string) => `finance-budget-unit-config:${month}`;

export async function loadBudgetUnitConfig(month: string): Promise<BudgetUnitConfig> {
  try {
    return (await redis.get<BudgetUnitConfig>(budgetUnitConfigKey(month))) ?? {};
  } catch {
    return {};
  }
}

export async function saveBudgetUnitConfig(month: string, config: BudgetUnitConfig): Promise<void> {
  try {
    await redis.set(budgetUnitConfigKey(month), config);
  } catch (e) {
    console.error("finance.saveBudgetUnitConfig failed", e);
  }
}
```

Same try/catch-with-safe-default posture as every other loader (empty `{}` on failure), same
console.error-and-swallow on save. No new error-handling convention introduced.

### `financeActions.ts` — new pair, mirror of `getBudgetForMonth`/`handleSaveBudget`

```ts
import { /* … */ loadBudgetUnitConfig, saveBudgetUnitConfig } from "./kvAdapter";
import type { BudgetUnitConfig } from "@/features/finance/domain";

export async function getBudgetUnitConfigForMonth(month: string): Promise<BudgetUnitConfig> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return {};
  return loadBudgetUnitConfig(month);
}

export async function handleSaveBudgetUnitConfig(
  month: string,
  config: BudgetUnitConfig
): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveBudgetUnitConfig(month, config);
}
```

Same `wishlist_auth` cookie guard and early-return-empty pattern as the budget actions. No
`revalidatePath` — the flat budget save path doesn't call it either, and the client keeps its own
optimistic state; parity is intentional.

### SSR + screen wiring (thread the config next to the budget it derives)

- `app/finance/page.tsx`: add `loadBudgetUnitConfig(currentMonth)` to the existing `Promise.all`,
  pass `initialUnitConfig` and `onSaveUnitConfig={handleSaveBudgetUnitConfig}` into `FinanceScreen`.
- `FinanceScreen.tsx`: add `monthUnitConfig` state next to `monthBudget`; include
  `getBudgetUnitConfigForMonth(selectedMonth)` in the existing month-change `Promise.all` reload so
  budget and config always load as one unit; pass `initialUnitConfig` + `onSaveUnitConfig` to
  `BudgetTab`. The `key={budgetLoadedFor}` remount already resets `BudgetTab` per month — the config
  rides along for free.

## 3. UI wiring — `BudgetTab.tsx`

### New props / state
- `BudgetTab` gains `initialUnitConfig: BudgetUnitConfig` and
  `onSaveUnitConfig: (config: BudgetUnitConfig) => Promise<void>`.
- New state `const [unitConfig, setUnitConfig] = useState(initialUnitConfig)`, living beside the
  existing `budget` state and threaded into `GroupSection`/`CardsSection` through the shared
  `ResponsiveViewProps` (add `unitConfig`, `onUnitBlur`, `onToggleUnitMode`).

### Per-category toggle (placement)
A small button in the existing action cluster of each category row (next to `+` / `Cerrar`), so no
new column or layout row is introduced. Spanish UI copy to match the app: label **"Unitario"** when
off (`aria-pressed={false}`), **"Fijo"** when on. Applies uniformly to every category row (income,
expense, refund) — no special-casing, and it satisfies the spec's per-category requirement.

### Rendering the two modes (in both `GroupSection` and `CardsSection`)
Inside the "Presupuesto" cell, branch on `unitConfig[cat]`:
- **absent** → today's single flat `<input type="number">` exactly as-is (zero behavior change).
- **present** → three narrow `<input type="number">`s — Unit amount, Quantity, Factor — stacked
  (vertical on desktop's dense cell, as label/value rows on the mobile card), plus the derived total
  shown **read-only** (reusing `formatCLP`). Factor input uses `step="any"` so `0.9` is enterable;
  unit amount and quantity keep `min="0"`.

The unit inputs stay **uncontrolled with `defaultValue` and key off the existing `inputKey`**, same
as the flat input, so the "Copiar desde" `inputKey` bump also resets them to copied values.

### Compute-on-blur behavior (single write path)
Blur handler recomputes the total from config and writes both stores in one path — this is the
mitigation for the "derived total vs. config drift" risk:

```ts
const handleUnitBlur = (cat: string, field: keyof UnitConfig, raw: string) => {
  const cur = unitConfig[cat] ?? { unitAmount: 0, ...DEFAULT_UNIT_CONFIG };
  const nextCfg = { ...cur, [field]: Math.max(0, Number(raw) || 0) }; // same parse as flat handleBlur
  const nextConfig = { ...unitConfig, [cat]: nextCfg };
  setUnitConfig(nextConfig);
  onSaveUnitConfig(nextConfig);

  const nextBudget = { ...budget, [cat]: deriveUnitTotal(nextCfg) };
  setBudget(nextBudget);
  onSave(nextBudget);
};
```

Reading the other two fields from committed `unitConfig` state (each blur commits) avoids needing
refs to all three inputs. The `Math.max(0, Number(raw) || 0)` parse is copied verbatim from the
existing `handleBlur` — no new numeric-parsing convention.

### Toggling
- **Enable** (`onToggleUnitMode`, cat not yet in config): seed
  `{ unitAmount: budget[cat] ?? 0, quantity: 1, factor: 1 }`, so the total is unchanged the instant
  you switch (unitAmount = old flat value, ×1 ×1). Immediately recompute + persist both stores
  (config write + `budget[cat] = deriveUnitTotal(seed)`), then bump `inputKey` so the fields mount
  with the seeded `defaultValue`s. Satisfies "defaults quantity/factor to 1".
- **Disable** (cat in config): delete the entry from `unitConfig` (persist the shrunk config),
  **keep** the last derived `budget[cat]` as-is, bump `inputKey` so the flat input remounts
  pre-filled with that total. Satisfies "Disabling unit mode falls back to the flat total".

## 4. "Copiar desde" decision (explicit)

**Decision: copy carries the unit config, and derived totals are recomputed from it on copy.**
This is the proposal's preferred branch, not the fallback.

`handleCopy` currently loads only `getBudgetForMonth(refMonth)`. Change it to load both in parallel:

```ts
const [refBudget, refConfig] = await Promise.all([
  getBudgetForMonth(refMonth),
  getBudgetUnitConfigForMonth(refMonth),
]);

// Guarantee budget/config sync even if the reference month ever drifted:
const nextBudget = { ...refBudget };
for (const [cat, cfg] of Object.entries(refConfig)) nextBudget[cat] = deriveUnitTotal(cfg);

setUnitConfig(refConfig);
setBudget(nextBudget);
setInputKey((k) => k + 1);
onSaveUnitConfig(refConfig);
onSave(nextBudget);
```

Consequences, matching the spec scenarios:
- Unit-mode categories in the reference month arrive in unit mode, with `unitAmount`/`factor`
  copied and **`quantity` copied but fully editable** — the user re-checks the occurrence count for
  the new month (an inherent, documented tradeoff, not a bug).
- `budget[cat]` for those categories equals the recomputed total (sync guaranteed by the loop).
- Flat-only categories copy their flat number and get **no** unit-config entry (they're absent from
  `refConfig`, so the loop never touches them).

Fallback ("copy the flat total when absent") is the natural result of the same code: a reference
month with no config record yields `refConfig = {}`, the loop is a no-op, and copy behaves exactly
as today.

## 5. Test strategy (strict TDD — vitest)

Write the domain test first, then the component tests, then wire persistence.

- **Pure domain — `features/finance/domain/BudgetUnitConfig.test.ts`** (primary TDD target):
  - `deriveUnitTotal({ 55000, 5, 0.9 }) === 247500` (spec's worked example).
  - defaults: `deriveUnitTotal({ N, 1, 1 }) === N`.
  - rounding: a fractional factor produces an integer (no float noise).
  This is the only branch with real arithmetic; keeping it pure means the formula is verified without
  React/Redis, and the UI just calls it.
- **Component — `features/finance/presentation/components/Budget/BudgetTab.test.tsx`** (extend the
  existing file):
  - Enabling unit mode on one category renders 3 fields; a sibling category stays a flat input.
  - Blurring a unit field recomputes the read-only total and calls both `onSave` (with the derived
    `budget[cat]`) and `onSaveUnitConfig` (with the breakdown).
  - Disabling unit mode restores a flat input pre-filled with the last total.
  - "Copiar desde" a month whose config has a unit-mode category renders that category in unit mode
    in the destination and recomputes its total.
- **Persistence** (`kvAdapter`/`financeActions`): thin mirrors of already-untested `loadBudget`/
  `saveBudget`/`getBudgetForMonth`; no new test infrastructure — parity with the existing convention
  is the bar, and the behavior is covered end-to-end by the component tests.

Regression guard: `computeBudgetSummary` / `computePendingExpenses` / `buildBudgetExportRows` are
untouched and their existing suites must stay green — proof that a derived total is indistinguishable
from a hand-entered flat number.

## ADR-style decisions

| # | Decision | Rationale | Rejected alternative |
|---|----------|-----------|----------------------|
| D1 | Separate KV key `finance-budget-unit-config:{month}`, not a richer `budget` value | Keeps `budget` a `Record<string, number>` so the 3 downstream consumers need zero changes; additive & reversible | Change `budget[cat]` to an object → breaks every consumer signature and the export |
| D2 | `deriveUnitTotal` is a pure domain function, single write path | Closes the "config vs. total drift" risk; unit-testable under strict TDD without React/Redis | Recompute at read time in each consumer → spreads formula knowledge, defeats "consumers untouched" |
| D3 | `Math.round` the derived total | CLP has no cents; prevents float noise from non-terminating factors reaching storage/summary | Store raw float → drift and mismatched summary/export totals |
| D4 | "Copiar desde" carries config + recomputes totals; `quantity` copied but editable | Preferred proposal branch; guarantees dest budget/config sync; matches all copy scenarios | Copy flat total only → loses breakdown, reverts to a UX regression the proposal calls out |
| D5 | Enable seeds `unitAmount = current flat total`, `quantity=1`, `factor=1` | Total is unchanged the moment you toggle — no surprising jump; satisfies default-to-1 spec | Seed `unitAmount=0` → total drops to 0 on toggle, confusing |
| D6 | Toggle button in the existing action cluster; uncontrolled inputs keyed on `inputKey` | Reuses the current row layout and the copy-reset mechanism; no new column or controlled-input rework | New grid column / controlled inputs → larger diff, breaks the copy `inputKey` reset pattern |

## Out of scope (unchanged, per proposal)

`computeBudgetSummary.ts`, `computePendingExpenses.ts`, `buildBudgetExportRows.ts`,
`AddTransactionModal.tsx`, `FinanceTransaction`, and any calendar/weeks-in-month or free-text parser.
No migration of existing flat-only `finance-budget:{month}` data.
