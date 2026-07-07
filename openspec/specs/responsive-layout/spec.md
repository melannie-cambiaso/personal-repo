# Delta for Responsive Layout

## ADDED Requirements

### Requirement: BudgetTab mobile card layout

At mobile viewports (~375-430px), the system MUST render BudgetTab's category data as stacked cards instead of the dense multi-column table. At desktop breakpoints, the system MUST keep the existing table layout unchanged.

#### Scenario: Mobile renders stacked cards

- GIVEN the viewport is ~375-430px wide
- WHEN BudgetTab renders
- THEN each category MUST be presented as a stacked card, not a table row

#### Scenario: Desktop keeps the table

- GIVEN the viewport is at an existing desktop breakpoint
- WHEN BudgetTab renders
- THEN the existing table layout MUST render unchanged

#### Scenario: No information loss on mobile

- GIVEN the mobile stacked-card layout is rendered
- WHEN the user inspects a category card
- THEN the category name, budget, actual, and diff values MUST all be present and legible, with no clipped or wrapped currency values

### Requirement: Minimum tap target for icon-only controls

Icon-only interactive controls in `ShoppingItemRow`, `CategoryTabs`, and BudgetTab action buttons MUST have a minimum tap target of approximately 44x44px on mobile viewports.

#### Scenario: Icon-only control meets tap target

- GIVEN an icon-only control (e.g. edit/delete affordance) in `ShoppingItemRow`, `CategoryTabs`, or a BudgetTab action button
- WHEN rendered at a mobile viewport
- THEN its interactive hit area MUST be at least ~44x44px

#### Scenario: Adjacent icon controls remain distinguishable

- GIVEN two icon-only controls sit next to each other (e.g. edit and delete)
- WHEN both meet the minimum tap target
- THEN they MUST NOT visually overlap or merge into a single hit area

### Requirement: Modal form grid reflow on mobile

Modal form field grids currently using `grid-cols-2` with no responsive fallback (`WishlistAddItemModal`, `EditItemModal`/`AddItemModal` in home-improvements, `ItemFormFields`, `EntryFormFields` in savings) MUST reflow to a single column at mobile viewports.

#### Scenario: Single column on mobile

- GIVEN one of the affected modals is open at a mobile viewport
- WHEN the form grid renders
- THEN all fields MUST be laid out in a single column

#### Scenario: No field lost in reflow

- GIVEN the single-column mobile layout is rendered
- WHEN the user inspects the form
- THEN every field present in the two-column desktop layout MUST also be present and usable in the single-column mobile layout

#### Scenario: Desktop two-column layout unaffected

- GIVEN one of the affected modals is open at a desktop breakpoint
- WHEN the form grid renders
- THEN the existing two-column layout MUST remain unchanged

### Requirement: Mobile-only scope, no tablet or desktop regression

The system's responsive layout work MUST target mobile viewports (~375-430px) only. Tablet-width (~768px) behavior is explicitly out of scope and MUST NOT be assumed to change. Existing desktop behavior MUST NOT regress.

#### Scenario: Tablet viewport unaffected

- GIVEN the viewport is ~768px wide
- WHEN any of BudgetTab, the affected modals, or the tap-target controls render
- THEN their layout MUST behave as it did before this change (no new tablet-specific handling is required or guaranteed)

#### Scenario: Desktop behavior preserved

- GIVEN the viewport is at an existing desktop breakpoint
- WHEN any of the affected components render
- THEN their existing desktop behavior (layout, sizing, interactions) MUST be unchanged
