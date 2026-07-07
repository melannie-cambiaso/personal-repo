# Tasks: Mobile-first pass for `wishlist-meme`

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~550-650 total across all slices; each slice individually ~50-250 |
| 400-line budget risk | High (as one PR) / Low (per slice) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (nav) → PR 2 (BudgetTab) → PR 3 (tap targets) → PR 4 (modal grids) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Slices are independent (no cross-slice code dependency), so **stacked-to-main** fits: each PR merges on its own once green, in any order, none blocks another.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Drawer nav (`features.ts` + `AppNav` + layout mount) | PR 1 | Independent; ~200-220 lines |
| 2 | `BudgetTab` cards/table split | PR 2 | Independent; highest risk (money screen); ~200-250 lines |
| 3 | Tap-target fixes (shopping-list) | PR 3 | Independent; ~50 lines |
| 4 | Modal form grid reflow (5 files) | PR 4 | Independent; mechanical; ~80-100 lines |

## Phase 1: Drawer Navigation (PR 1)

- [x] 1.1 RED: `shared/navigation/features.test.ts` — assert `FEATURE_NAV_ITEMS` has exactly 6 entries, no `login`, each has `href`/`label`/`icon`.
- [x] 1.2 GREEN: create `shared/navigation/features.ts` exporting `FeatureNavItem`/`FEATURE_NAV_ITEMS` (6 features). *(mobile-navigation: drawer lists every feature)*
- [x] 1.3 RED: `shared/components/AppNav/AppNav.test.tsx` — stub `HTMLDialogElement.prototype.showModal/close` in `beforeAll`; mock `usePathname`; assert trigger renders with `aria-expanded=false`, opens drawer on click (`showModal` called), lists 6 links, active link highlighted for a feature route, no active link on `/`, closes on close-button click, closes on pathname change (auto-close effect). *(mobile-navigation: reachable from every screen, open/close, active route, back-link independence)*
- [x] 1.4 GREEN: create `shared/components/AppNav/AppNav.tsx` — `"use client"`, local `useState`, `usePathname`, native `<dialog>`, trigger `lg:hidden`, `fixed top-4 right-4 z-40`.
- [x] 1.5 GREEN: modify `app/layout.tsx` to render `<AppNav />` in `<body>` before `{children}`.
- [x] 1.6 Run `npm run test` — full suite green, no regression.

## Phase 2: BudgetTab Structural Split (PR 2)

- [x] 2.1 RED: extend `features/finance/presentation/components/Budget/BudgetTab.test.tsx` — assert `data-testid="budget-cards"` and `data-testid="budget-table"` both render; scope existing assertions with `within(getByTestId(...))` per view; assert `+`/`Cerrar` buttons have `min-h-11 min-w-11`. *(deviation: class-name assertions dropped — see apply-progress notes)*
- [x] 2.2 GREEN: extract `BudgetCardsView` (`sm:hidden`) and `BudgetTableView` (`hidden sm:block`) from shared computed model in `BudgetTab.tsx`; desktop table markup unchanged; add `flex-wrap` to the copy/export control bar; bump action buttons to tap-target size. *(responsive-layout: BudgetTab mobile card layout, tap target, no desktop regression)*
- [x] 2.3 Run `npm run test` — verify both views render identical data, no clipped/wrapped currency in cards view.

## Phase 3: Tap-Target Fixes (PR 3)

- [x] 3.1 RED: extend `ShoppingItemRow.test.tsx` and `CategoryTabs.test.tsx` — assert edit/delete icon buttons remain individually distinguishable (no overlap). *(deviation: className assertions dropped — see apply-progress notes; used Approval Testing pattern instead of fresh RED since this is a style-only refactor of existing behavior)*
- [x] 3.2 GREEN: apply `min-h-11 min-w-11 inline-flex items-center justify-center` to icon buttons in `ShoppingItemRow.tsx` and `CategoryTabs.tsx`. *(responsive-layout: minimum tap target)*
- [x] 3.3 Run `npm run test` — verify no regression in existing shopping-list interaction tests.

## Phase 4: Modal Form Grid Reflow (PR 4)

- [x] 4.1 RED: create/extend tests for `WishlistAddItemModal.test.tsx`, `EditItemModal.test.tsx` + `AddItemModal.test.tsx` + `ItemFormFields.test.tsx` (home-improvements), `EntryFormFields.test.tsx` (savings) — assert grid container has `grid-cols-1 sm:grid-cols-2`, all fields present. *(deviation: none of the 5 components had an existing test file — used Approval Testing pattern (behavioral assertions: all fields present via `getByLabelText`, fields functional, form submits with correct values) instead of literal className assertions, per strict-tdd.md's Implementation Detail Coupling Rule and the same deviation established in Phase 2/3 — see apply-progress notes)*
- [x] 4.2 GREEN: change `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` in the 5 files above. *(responsive-layout: modal form grid reflow, no field lost, desktop unaffected)*
- [x] 4.3 Run `npm run test` — full suite green.
