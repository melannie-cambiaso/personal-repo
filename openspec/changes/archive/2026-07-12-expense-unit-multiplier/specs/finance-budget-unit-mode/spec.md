# Finance Budget Unit Mode Specification

## Purpose

Let a Planned Budget category be defined as a recurring unit cost (unit amount, quantity, factor)
instead of one flat number, while `budget[category]` keeps holding the derived total so
`computeBudgetSummary`, `computePendingExpenses`, and `buildBudgetExportRows` stay unchanged.
Scope is Planned Budget only; real transactions are untouched.

## Requirements

### Requirement: Unit mode is an opt-in per-category toggle

Each category MUST have its own unit-mode toggle. The system MUST NOT provide a global setting.

#### Scenario: Toggling one category does not affect others

- GIVEN "DBT" and "Arriendo" are both in flat mode
- WHEN the user enables unit mode for "DBT"
- THEN "DBT" MUST render the 3 unit fields
- AND "Arriendo" MUST stay a flat numeric input, unaffected

### Requirement: Unit mode exposes exactly 3 manual numeric fields

In unit mode the system MUST expose only `unitAmount`, `quantity` (default `1`), and `factor`
(default `1`; e.g. `90%` = `0.9`) as numeric inputs. The system MUST NOT provide free-text entry,
a shorthand parser, or any auto-fill/calendar/weeks-in-month computation for `quantity` — it MUST
always be typed manually, exactly like the other two fields.

#### Scenario: New unit-mode category defaults quantity and factor to 1

- GIVEN a category is switched to unit mode with no prior config for the month
- WHEN the unit fields render
- THEN `quantity` MUST default to `1` and `factor` MUST default to `1`
- AND no auto-fill action or text input MUST be offered for any field

### Requirement: The derived total is `unitAmount × quantity × factor`

The system MUST compute the total as `unitAmount × quantity × factor` and write it into
`budget[category]` on save. No other formula MAY be used.

#### Scenario: Editing a unit field recomputes and persists the total

- GIVEN `unitAmount = 55000`, `quantity = 5`, `factor = 0.9`
- WHEN the user blurs any of the 3 fields
- THEN the total MUST be `247500` and MUST be saved to `budget[category]`, shown read-only

#### Scenario: Downstream consumers are unaffected

- GIVEN a unit-mode category has derived total `247500` in `budget[category]`
- WHEN `computeBudgetSummary`, `computePendingExpenses`, or `buildBudgetExportRows` runs
- THEN each MUST read `247500` as a plain number, with no awareness of `unitAmount`, `quantity`,
  or `factor` required

### Requirement: The unit breakdown persists per category per month and is editable on reopen

The system MUST persist `unitAmount`, `quantity`, `factor` per category per month in
`finance-budget-unit-config:{month}`, separate from the flat `budget` map. Reopening the category
MUST show the saved parts, not just the total, and MUST allow re-editing.

#### Scenario: Reopening shows the saved parts

- GIVEN a category was saved with `unitAmount = 55000`, `quantity = 5`, `factor = 0.9`
- WHEN the user reopens that category later
- THEN the 3 fields MUST show those saved values, not just `247500`, and remain editable

#### Scenario: Editing one month's config does not affect another month's

- GIVEN `2026-06` has `quantity = 5` saved and `2026-07` has no config yet
- WHEN the user sets `quantity = 4` for `2026-07`
- THEN `2026-07` MUST save `quantity = 4` while `2026-06` MUST remain `quantity = 5`

### Requirement: Categories and months without unit config behave exactly as today

A category with no entry in `finance-budget-unit-config:{month}` MUST render and behave exactly
as a flat-only input. No migration of existing `finance-budget:{month}` data is required.

#### Scenario: A pre-existing flat-only month is unaffected

- GIVEN a month's `finance-budget:{month}` data predates this feature, with no unit-config entry
- WHEN the budget tab renders that month
- THEN every category MUST render as a plain flat input, identical to pre-feature behavior

#### Scenario: Disabling unit mode falls back to the flat total

- GIVEN a category is in unit mode with derived total `247500`
- WHEN the user disables unit mode
- THEN the category MUST render as a flat input pre-filled with `247500`

### Requirement: "Copiar desde" MUST carry over unit config or fall back to the flat total

Copying a budget from a reference month MUST carry over the reference category's unit config
(`unitAmount`, `quantity`, `factor`) when present, or copy the flat total when absent. The copy
MUST NOT leave the destination's `budget[category]` out of sync with whatever was copied.

#### Scenario: Copying a unit-mode category carries its config

- GIVEN the reference month has "DBT" in unit mode (`unitAmount = 55000`, `factor = 0.9`)
- WHEN the user copies that month into the destination month
- THEN the destination's unit config MUST contain the same `unitAmount` and `factor`
- AND `budget["DBT"]` MUST equal the recomputed total
- AND `quantity` MUST remain editable, since occurrence counts typically change between months

#### Scenario: Copying a flat-only category is unaffected

- GIVEN the reference month has "Arriendo" as flat, with no unit config
- WHEN the user copies that month
- THEN `budget["Arriendo"]` MUST equal the reference's flat value and no unit-config entry MUST
  be created

## Non-Goals

- No changes to real transaction entry (`AddTransactionModal.tsx`, `FinanceTransaction`).
- No free-text/shorthand parsing; no auto-computed `quantity` (calendar/weekday/weeks-in-month).
- No requirement changes to `finance-budget-summary`, `computeBudgetSummary.ts`,
  `computePendingExpenses.ts`, or `buildBudgetExportRows.ts`.
- No data migration of existing flat-only `finance-budget:{month}` entries.
