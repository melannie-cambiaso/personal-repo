# Tasks: Unit-based budget entries (unit amount × quantity × factor)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~390-410 total (borderline over budget as one PR) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (domain + persistence, ~95 lines) → PR 2 (BudgetTab UI + tests, ~300 lines) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

Breakdown: `BudgetUnitConfig.ts`+test (~45), `domain/index.ts` (~3), `kvAdapter.ts` (~15),
`financeActions.ts` (~12), `data/index.ts` (~1), `page.tsx` (~4), `FinanceScreen.tsx` (~12) — Phase
1+2 total ~92 lines, low risk standalone. `BudgetTab.tsx` (~180-200, duplicated across
`GroupSection`/`CardsSection` table+card views per design) + extended `BudgetTab.test.tsx`
(~90-120 for 4 new scenarios) — Phase 3+4 total ~280-320 lines. Combined single-PR estimate sits
at/above the 400-line guard, so it is marked **High** and split at the existing phase boundary
(non-UI vs UI) rather than mid-component.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain (`deriveUnitTotal`) + persistence (`kvAdapter`, `financeActions`, SSR wiring) | PR 1 | Base branch TBD by chain strategy; tests included; ~92 lines |
| 2 | `BudgetTab.tsx` unit-mode toggle/fields/blur/copy + extended `BudgetTab.test.tsx` | PR 2 | Depends on PR 1's exported `deriveUnitTotal`/`BudgetUnitConfig` and `onSaveUnitConfig` prop; ~280-320 lines |

## Phase 1: Domain — `BudgetUnitConfig` / `deriveUnitTotal`

- [x] 1.1 RED: create `features/finance/domain/BudgetUnitConfig.test.ts`. Cases:
  - `deriveUnitTotal({ unitAmount: 55000, quantity: 5, factor: 0.9 }) === 247500` (spec's worked
    example).
  - Defaults: `deriveUnitTotal({ unitAmount: N, quantity: 1, factor: 1 }) === N`.
  - Rounding: a fractional factor (e.g. `1/3`) produces an integer, no float noise.
  Suite must fail — the module does not exist yet.
- [x] 1.2 GREEN: implement `features/finance/domain/BudgetUnitConfig.ts` — `UnitConfig` type
  (`unitAmount`, `quantity`, `factor`), `BudgetUnitConfig` type (`Record<string, UnitConfig>`),
  `deriveUnitTotal(cfg) => Math.round(cfg.unitAmount * cfg.quantity * cfg.factor)`, and
  `DEFAULT_UNIT_CONFIG = { quantity: 1, factor: 1 }`. Test suite (1.1) passes.
- [x] 1.3 GREEN: export `UnitConfig`, `BudgetUnitConfig`, `deriveUnitTotal`, `DEFAULT_UNIT_CONFIG`
  from `features/finance/domain/index.ts`, matching the existing named-export style.

## Phase 2: Persistence — `kvAdapter` + `financeActions` + SSR wiring

- [ ] 2.1 `features/finance/data/kvAdapter.ts`: add `budgetUnitConfigKey(month)` →
  `` `finance-budget-unit-config:${month}` ``, `loadBudgetUnitConfig(month)` (mirror
  `loadBudget`'s try/catch → `{}` default), `saveBudgetUnitConfig(month, config)` (mirror
  `saveBudget`'s try/catch → `console.error`).
- [ ] 2.2 `features/finance/data/financeActions.ts`: import `loadBudgetUnitConfig`,
  `saveBudgetUnitConfig` from `./kvAdapter`; add `getBudgetUnitConfigForMonth(month)` and
  `handleSaveBudgetUnitConfig(month, config)`, mirroring `getBudgetForMonth`/`handleSaveBudget`'s
  `wishlist_auth` cookie guard and early-return-empty pattern.
- [ ] 2.3 `features/finance/data/index.ts`: export `loadBudgetUnitConfig` alongside the existing
  `loadBudget` barrel export.
- [ ] 2.4 `app/finance/page.tsx`: add `loadBudgetUnitConfig(currentMonth)` to the existing
  `Promise.all` (line ~20), destructure `initialUnitConfig`, pass `initialUnitConfig` and
  `onSaveUnitConfig={handleSaveBudgetUnitConfig}` into `<FinanceScreen>`.
- [ ] 2.5 `features/finance/presentation/screens/Dashboard/FinanceScreen.tsx`: add
  `initialUnitConfig: BudgetUnitConfig` and `onSaveUnitConfig` to `Props`; add
  `monthUnitConfig` state next to `monthBudget` (line ~36); add
  `getBudgetUnitConfigForMonth(selectedMonth)` to the month-change `Promise.all` (line ~47-56) and
  `setMonthUnitConfig` in the `.then`; pass `initialUnitConfig={monthUnitConfig}` and
  `onSaveUnitConfig={(c) => onSaveUnitConfig(selectedMonth, c)}` to `<BudgetTab>` (line ~168-177).

## Phase 3: UI — `BudgetTab` unit-mode toggle, fields, blur, copy (strict TDD)

- [ ] 3.1 RED: extend `features/finance/presentation/components/Budget/BudgetTab.test.tsx` —
  "enabling unit mode on one category renders the 3 unit fields (Unit amount, Quantity, Factor)
  while a sibling category stays a flat input." Must fail — toggle doesn't exist yet.
- [ ] 3.2 RED: add test — "blurring a unit field recomputes the read-only total and calls `onSave`
  with the derived `budget[cat]` and `onSaveUnitConfig` with the breakdown" (worked example
  `55000 × 5 × 0.9 = 247500`).
- [ ] 3.3 RED: add test — "disabling unit mode restores a flat input pre-filled with the last
  derived total."
- [ ] 3.4 RED: add test — "'Copiar desde' a month whose config has a unit-mode category renders
  that category in unit mode in the destination and recomputes its total; a flat-only category
  copies unaffected with no unit-config entry created."
- [ ] 3.5 GREEN: add `initialUnitConfig`/`onSaveUnitConfig` props and `unitConfig` state to
  `BudgetTab` (`Props` interface + `useState`, next to `budget`).
- [ ] 3.6 GREEN: implement `handleUnitBlur(cat, field, raw)` — recompute `nextCfg`,
  `setUnitConfig`/`onSaveUnitConfig`, then `setBudget`/`onSave` with
  `deriveUnitTotal(nextCfg)`, per design's single-write-path snippet.
- [ ] 3.7 GREEN: implement `onToggleUnitMode(cat)` — enable seeds
  `{ unitAmount: budget[cat] ?? 0, quantity: 1, factor: 1 }`, persists both stores, bumps
  `inputKey`; disable deletes the `unitConfig[cat]` entry, persists the shrunk config, keeps
  `budget[cat]` as-is, bumps `inputKey`.
- [ ] 3.8 GREEN: add `unitConfig`/`onUnitBlur`/`onToggleUnitMode` to `ResponsiveViewProps` and
  thread them through `BudgetTableView`/`BudgetCardsView` into every `GroupSection`/`CardsSection`
  call (income/expense/refund).
- [ ] 3.9 GREEN: add the per-category toggle button ("Unitario" off / "Fijo" on,
  `aria-pressed`) to `GroupSection`'s existing action cluster (next to `+`/`Cerrar`).
- [ ] 3.10 GREEN: branch `GroupSection`'s "Presupuesto" cell on `unitConfig[cat]` — absent renders
  today's flat `<input>` unchanged; present renders 3 uncontrolled `<input>`s (unit amount
  `min="0"`, quantity `min="0"`, factor `step="any"`) keyed on `inputKey`, plus the read-only
  derived total via `formatCLP`.
- [ ] 3.11 GREEN: mirror 3.9-3.10 in `CardsSection` (mobile stacked-card layout) — toggle button +
  flat-vs-3-field branch as label/value rows + read-only total.
- [ ] 3.12 GREEN: update `handleCopy` — load `getBudgetUnitConfigForMonth(refMonth)` in parallel
  with `getBudgetForMonth(refMonth)`; recompute `nextBudget[cat] = deriveUnitTotal(cfg)` for every
  category in `refConfig`; `setUnitConfig(refConfig)` + `onSaveUnitConfig(refConfig)` alongside the
  existing `setBudget`/`onSave`/`setInputKey` calls. Test suite (3.1-3.4) passes.

## Phase 4: Regression check

- [ ] 4.1 Run `npm run test` — full suite green: existing `computeBudgetSummary.test.ts`,
  `computePendingExpenses.test.ts`, `buildBudgetExportRows.test.ts` unaffected (files untouched);
  new `BudgetUnitConfig.test.ts` and extended `BudgetTab.test.tsx` passing.
- [ ] 4.2 Run `tsc --noEmit` — clean, confirming the new `UnitConfig`/`BudgetUnitConfig` types and
  widened `Props` type-check across `kvAdapter.ts`, `financeActions.ts`, `page.tsx`,
  `FinanceScreen.tsx`, `BudgetTab.tsx`.
