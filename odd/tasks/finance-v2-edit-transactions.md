# Feature: finance v2 edit transactions

Locator: `odd/tasks/finance-v2-edit-transactions.md` · Engram mirror: `odd/finance-v2-edit-transactions/tasks`
Branch: `feat/finance-v2-edit-transactions`

## Objective
Let the user edit an existing finance v2 transaction (movement); today rows can only be deleted.

## Decisions (user-confirmed 2026-10-04)
- Editing cannot change the transaction month: the month field is locked in edit mode, and the
  edit is saved with `handleSaveTransactions` on the viewed month.
- Every diff is shown to the user and approved before it is written.
- (agent design) Domain `updateTransaction(list, tx)` replaces by `id`; unknown ids leave the list
  unchanged; input is never mutated.
- (agent design) The add modal/form is reused with an optional `initialTransaction`; an "Editar"
  button sits next to "Eliminar" on each row.

## Tasks
- [x] T1 — Domain: `updateTransaction` + tests. RED (2 failing) → GREEN, 6/6; prettier clean. Barrel export deferred to T3 (first consumer). Commit `ab5596e`.
- [x] T2 — Form/modal: optional `initialTransaction` seeds the fields, locks the month, submit label "Guardar cambios", orphan snapshot kept + tests. RED (5 failing) → GREEN, finance-v2 476/476; tsc + eslint clean.
- [ ] T3 — Hook/screen/row: `updateTransaction` in the hook, "Editar" button on the row, modal wired in edit mode + tests.
- [ ] T4 — Verify: `npm run test`, `npm run build`, `npx eslint .`, prettier.
