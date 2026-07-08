# Savings Monthly Breakdown Specification

## Purpose

Give the user a month-by-month view of their savings activity — deposits, expenses, and net —
derived from the existing flat `SavingsEntry[]` list, so they can review trends over time
(`"cómo he ido y qué puedo mejorar"`) without manually scanning the reverse-chronological
"Historial" list. This is a pure client-side derivation plus a read-only presentation view; no
storage, server action, or existing tab/component changes.

## Requirements

### Requirement: `groupEntriesByMonth` groups entries by calendar month

The system MUST provide a pure function `groupEntriesByMonth(entries: SavingsEntry[]):
MonthlySavingsGroup[]` that buckets `entries` by month key, where the month key is
`entry.date.slice(0, 7)` (the entry's `"YYYY-MM-DD"` date string sliced to `"YYYY-MM"`, with no
`Date` object parsing and no timezone conversion). Each `MonthlySavingsGroup` MUST have the shape
`{ month: string; totalDepositos: number; totalGastos: number; net: number; entries:
SavingsEntry[] }`.

#### Scenario: Entries in the same month are bucketed together

- GIVEN entries with dates `"2026-06-03"`, `"2026-06-17"`, and `"2026-07-01"`
- WHEN `groupEntriesByMonth` is called with these entries
- THEN the result MUST contain exactly 2 groups: one with `month: "2026-06"` holding the first two
  entries, and one with `month: "2026-07"` holding the third

#### Scenario: Empty input returns an empty array

- GIVEN an empty `SavingsEntry[]` array
- WHEN `groupEntriesByMonth` is called
- THEN the result MUST be `[]`

### Requirement: Each group computes correct totals and net

For each `MonthlySavingsGroup`, the system MUST compute `totalDepositos` as the sum of `amount`
for all entries in that group with `type: "deposito"`, `totalGastos` as the sum of `amount` for
all entries with `type: "gasto"`, and `net` as `totalDepositos - totalGastos`.

#### Scenario: Mixed deposito/gasto entries in one month

- GIVEN a month bucket with a `"deposito"` entry of `amount: 100000`, a `"deposito"` entry of
  `amount: 50000`, and a `"gasto"` entry of `amount: 30000`
- WHEN the group's totals are computed
- THEN `totalDepositos` MUST be `150000`
- AND `totalGastos` MUST be `30000`
- AND `net` MUST be `120000` (`150000 - 30000`)

#### Scenario: A month with only gasto entries has zero deposits and negative net

- GIVEN a month bucket containing only `"gasto"` entries totaling `amount: 40000`
- WHEN the group's totals are computed
- THEN `totalDepositos` MUST be `0`
- AND `totalGastos` MUST be `40000`
- AND `net` MUST be `-40000`

### Requirement: Groups are sorted newest-first by month

The system MUST return `MonthlySavingsGroup[]` sorted by `month` descending (newest first),
consistent with the existing reverse-chronological order of the "Historial" list.

#### Scenario: Groups across multiple months are ordered newest-first

- GIVEN entries spanning `"2026-05"`, `"2026-06"`, and `"2026-07"`
- WHEN `groupEntriesByMonth` is called
- THEN the returned array's first element MUST have `month: "2026-07"`, the second `month:
  "2026-06"`, and the third `month: "2026-05"`

### Requirement: A "Por mes" tab renders the monthly breakdown

The system MUST add a third tab labeled "Por mes" to the savings screen, alongside the existing
"Historial" and "Metas" tabs, without modifying either existing tab's content or behavior. The
"Por mes" tab MUST render `groupEntriesByMonth(entries)` as a scrollable list, newest month first,
with one card per month showing three labeled totals — Depositado (`totalDepositos`), Gastado
(`totalGastos`), and Neto (`net`) — each formatted with the existing `formatCLP` utility, and a
month header formatted with the existing `formatMonth` utility.

#### Scenario: Selecting "Por mes" shows all months with correct totals

- GIVEN savings entries exist across 3 different months
- WHEN the user selects the "Por mes" tab
- THEN the view MUST display 3 month cards, ordered newest-first
- AND each card MUST show a `formatMonth`-formatted header (e.g. "Junio 2026")
- AND each card MUST show Depositado, Gastado, and Neto values formatted via `formatCLP`

#### Scenario: No savings entries yields an empty "Por mes" view with no error

- GIVEN there are no savings entries
- WHEN the user selects the "Por mes" tab
- THEN the view MUST render without error and show no month cards (empty list, no crash)

#### Scenario: "Historial", "Metas", and all-time summary cards are unaffected

- GIVEN the "Por mes" tab has been added
- WHEN the user views the "Historial" tab, the "Metas" tab, or the all-time
  `SavingsSummaryCards`
- THEN each MUST render exactly as it did before this change, with no layout, data, or behavior
  differences

## Non-Goals

- No chart library or CSS bar chart — totals are rendered as plain numbers only.
- No automatic insights, comparisons, or month-over-month deltas.
- No changes to `features/finance/`, `features/savings/data/`, `SavingsEntry.ts`, the existing
  "Historial" list, the "Metas" tab, or `SavingsSummaryCards`.
- No new server actions, storage keys, pagination, or virtualization.
