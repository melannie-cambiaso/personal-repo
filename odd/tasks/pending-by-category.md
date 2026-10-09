# Feature: pending by category

## Objective
Show two pending figures in the Budget tab `AccountCoverage` block:
"Pendiente por categoría" (per parent category, nets overspent subcategories against
the rest of their parent) and "Pendiente por subcategoría" (the current
`computePendingFromMain` figure). "Te faltan" keeps using the subcategory figure.

## Problem / why
The user summed the "quedan" of the category cards and it did not match the pending
figure: the current pending is per leaf (`max(budgeted - spent, 0)`), so overspent
subcategories are not netted. Showing the per-category figure makes the gap explainable.

## Scope / constraints
- Both figures exclude envelope-paid categories (Cuentas → Servicios/MACH).
- Shortfall/surplus line unchanged (balance − subcategory pending).
- Home `FinanceSummaryCard` unchanged.
- UI copy in Spanish (existing project copy).

## Tasks
- [x] T1 — Domain: `computePendingByCategory` sibling of `computePendingFromMain`, with tests (route: delegated, writer trigger: 2+ non-trivial files across T1+T2)
- [x] T2 — Presentation: view model + `AccountCoverage` render both lines, wire in `FinanceV2Screen`, update tests (route: delegated, same writer)

## Acceptance criteria
- Per-category pending = sum over parent categories of `max(budgeted - spent, 0)`, skipping envelope-paid ones.
- Labels "Pendiente por categoría" and "Pendiente por subcategoría" render; "Te faltan" unchanged.
- `npm test` and `npx tsc --noEmit` pass; `npm run lint` clean for touched files.

## Delivery
Strategy: single-pr (personal project, merged into main directly). Forecast < 400 lines.

## Progress / evidence
- T1 `46c33b3` — `features/finance-v2/domain/pendingByCategory.ts` (+ test, index export).
  RED: new test file failed (module missing); GREEN: 8/8 passed.
  Envelope rule: skip the top-level category whose id is `boundCategoryId`.
  `resolvePaidFrom` only matches a top-level bound id (all its subcategories, or the
  childless leaf itself), so the envelope never pays a single leaf inside a parent and
  no partial subtraction is needed. A parent's budgeted = sum of its leaves' month-aware
  budgets (card `view.total`), since `computeSpendComparison.categories` leaves parents at 0.
- T2 `cef2f55` — view model `pendingByCategory`, `AccountCoverage` renders
  "Pendiente por categoría" → "Pendiente por subcategoría" → "Saldo del mes";
  surplus/shortfall still uses the subcategory figure; `FinanceV2Screen` memo added;
  tests updated (incl. a netting scenario in `FinanceV2Screen.test.tsx`). Home unchanged.
- Verification (after T2): `npx vitest run features/finance-v2`: 42 files / 529 tests passed;
  `npm test`: 86 files / 867 tests passed; `npx tsc --noEmit`: exit 0;
  `npx eslint <touched files>`: no issues.

Next step: user review in the app; merge into main per repo policy.
