# Proposal: Mobile-first pass for `wishlist-meme`

## Intent

The app is desktop-first. On a ~375-430px phone, several screens break or become hard to use: `BudgetTab` (the finance/money screen) forces a 4-column dense table that wraps/clips currency values; icon-only controls in shopping-list and BudgetTab fall below the ~44px touch-target guideline; and multiple modal form grids (`grid-cols-2`) have no responsive fallback. Cross-feature navigation is also awkward: the only nav affordance on every feature page is a "← Inicio" back-link, forcing users through `/` to move between the 6 content features. Half the codebase already stacks grids mobile-first (`app/page.tsx`, `DashboardScreen`, `ZoneList`, `SavingsSummaryCards`); this change extends that convention everywhere and adds a shared mobile nav.

## Scope

### In Scope
- **Drawer nav**: hamburger/drawer menu listing all 6 content features (`login` excluded — auth route, not content, matches home-grid precedent), reachable from ALL screens (home + inside every feature) at mobile viewports, not just `/`. Trigger is hidden at desktop breakpoints (`lg:hidden`) to preserve current desktop appearance.
- **BudgetTab structural redesign**: stacked cards per category on mobile, keep existing table layout at desktop breakpoints. Carved out as its own slice (highest regression risk — money screen, no visual-regression tooling).
- **Utility-first Tailwind pass per feature**, extending the existing `sm:`/`md:`/`lg:` grid-stacking convention.
- **Tap targets**: raise icon-only controls below ~44px in `ShoppingItemRow.tsx`, `CategoryTabs.tsx`, and BudgetTab action buttons.
- **Modal form grids**: add responsive fallback to `grid-cols-2` fields, reviewed per-modal (WishlistAddItemModal, EditItemModal/AddItemModal home-improvements, ItemFormFields, EntryFormFields savings).
- State that a shared written convention (min tap size, standard breakpoint pattern, table→stacked-card rule) is expected so slices stay consistent.

### Out of Scope
- Tablet (~768px) breakpoint work — explicit non-goal.
- Bottom tab bar or improved back-link nav (drawer chosen instead; 6 features is too many for a clean bottom bar).
- Visual/E2E regression tooling (none exists; manual device testing is the QA gate).
- Authoring the convention doc itself and the `matchMedia`/`setupFiles` test infra — design-phase concerns, flagged not solved here.

## Capabilities

### New Capabilities
- `mobile-navigation`: drawer nav reachable from every screen for cross-feature jumps.
- `responsive-layout`: mobile-first layout, tap-target, and table-reflow behavior across features including BudgetTab.

### Modified Capabilities
- None (no existing `openspec/specs/`).

## Approach

Combine a utility-first Tailwind pass (extend existing breakpoint convention) with per-feature slicing. BudgetTab gets a distinct structural slice. Add one new shared drawer nav component — the first JS-driven responsive behavior in the repo — which introduces new interaction tests and test infra (design phase). A shared convention is codified in design before slices apply it.

## Affected Areas

| Area | Impact | Description |
|------|--------|------------|
| `shared/components/` (new drawer nav) | New | Hamburger/drawer nav, mounted app-wide |
| `shared/components/PageHeader/PageHeader.tsx` | Modified | Integrate/trigger drawer alongside back-link |
| `features/finance/.../Budget/BudgetTab.tsx` | Modified | Table → stacked cards on mobile, larger tap targets |
| `features/shopping-list/.../ShoppingItemRow.tsx`, `CategoryTabs.tsx` | Modified | Tap-target sizing |
| Modal form fields (5 files across wishlist, home-improvements, savings) | Modified | Responsive `grid-cols-2` fallback |
| `vitest.config.mts` | Modified | `matchMedia` mock + `setupFiles` (design-phase) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| BudgetTab reflow regresses money screen | Med | Own slice, careful manual QA, keep desktop table intact |
| No visual/E2E regression suite | High | Manual device testing as release gate |
| Inconsistent per-feature fixes | Med | Shared convention codified in design before slices |
| Drawer needs new test infra (`matchMedia`) | Med | Flag in design; add `setupFiles` before nav slice |

## Rollback Plan

Changes are UI-only, no data/schema migrations. Each slice is an isolated PR (per-feature or drawer/BudgetTab), so revert the offending slice's commit/PR without affecting others. The drawer nav is additive — reverting it restores the back-link-only model. BudgetTab retains its desktop table, so a mobile-card regression is reverted independently of other features.

## Dependencies

- Shared responsive convention + `matchMedia`/`setupFiles` test infra defined in `sdd-design` before dependent slices.

## Success Criteria

- [ ] Every feature is reachable from every screen via the drawer without returning to `/`.
- [ ] BudgetTab is readable and usable at ~375px (no clipped currency), desktop table unchanged.
- [ ] Icon-only controls meet the agreed minimum tap target.
- [ ] Modal form fields no longer force cramped 2-column layout on mobile.
- [ ] No regression in existing behavior-based test suite (`npm run test`).
