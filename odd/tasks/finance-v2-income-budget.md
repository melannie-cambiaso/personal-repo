# Feature: finance-v2 income budget

Locator: `odd/tasks/finance-v2-income-budget.md` · Engram mirror: `odd/finance-v2-income-budget/tasks`
Branch: `feat/finance-v2-income-budget` · Merge: fast-forward to `main` after the user reviews (no PRs).

## Specs
- S1 — Budgeted income per source. User: "quiero que en presupuesto tengamos lo presupuestado de
  ingreo" and, asked "¿un solo total o por fuente?": "por fuente". Sources are defined in the
  Presupuesto tab; each source has a name and a monthly amount. User: "Solo mensual (recomendado)" —
  no weekly frequency for income.
- S2 — Real vs budgeted. User: "que podamos trackear los ingresos reales vs los presupuestados".
  Presupuesto shows a compact block, per source and in total: budgeted, real and difference. User:
  "Presupuesto + Análisis (recomendado)": "Las fuentes se definen en Presupuesto, con un bloque
  compacto de presupuestado vs real. Análisis suma los ingresos a su resumen."
- S3 — Optional source on income transactions. User: "Opcional (recomendado)": "Si no elegís una, el
  ingreso cuenta como \"Sin fuente\": entra al total real pero no a ninguna fuente. Es lo mismo que
  pasa con los gastos sin categoría." Applies when creating and when editing an income in Movimientos.
- S4 — Análisis adds income to its summary (budgeted, real, difference), per S2's quoted answer.
- S5 — (agent design) Income sources live in the versioned `BudgetConfig`, so they follow the existing
  budget rules: an edit applies from the viewed month on, past months stay read-only, and stored data
  without income sources (or incomes without a source) keeps rendering as before. A source deleted from
  the budget makes its incomes count as "Sin fuente" (snapshot name kept on the transaction).

## Tasks
- [x] T1 — S1, S3, S5 domain: `IncomeSource` + optional `incomeSources` on `BudgetConfig`, shape
  validator, add/rename/set-amount/delete mutations, optional `source` snapshot on income
  transactions, `computeIncomeComparison`. Route: inline, test-first. Commit: `bb54275` (reviewed by the
  user). Evidence: RED 25 failing (missing module/functions, category edits dropping
  `incomeSources`) → GREEN domain 235/235, finance-v2 598/598, tsc clean. Every existing budget
  mutation now spreads `config`, otherwise a category edit would have deleted the income sources.
- [x] T2 — S1, S2 Presupuesto: budget hook mutations + income block in `BudgetTab` (view: budgeted vs
  real per source; edit: manage sources). Route: inline, test-first. Commit: `7c91618` (reviewed by the
  user). Evidence: RED (hook functions missing, `IncomeBudget` missing, screen income tests)
  → GREEN finance-v2 618/618, tsc clean, eslint only the known warning (moved with `InlineNameField`,
  extracted unchanged from `BudgetCategoryCard.tsx` for reuse). `BudgetTab` takes the block as an
  optional `income` slot, so its existing tests stay untouched.
- [x] T3 — S3 Movimientos: optional source picker for income in `TransactionForm` (create and edit).
  Route: inline, test-first. Commit: `2abce91` (reviewed by the user). Evidence: RED (no "Fuente"
  picker; screen income-on-Movimientos test) → GREEN finance-v2 625/625, tsc clean, eslint only the known
  warning. `incomeSourceOptions` is optional on form/modal/tab, so existing call sites and tests keep
  working; the existing "submits an income" test (no `source` key) still passes unchanged.
  Added on request (L5): `TransactionRow` shows an income's snapshotted source as "de <name>", like a
  tagged savings. RED (1 failing) → GREEN finance-v2 627/627, tsc clean, eslint only the known warning.
- [x] T4 — S4 Análisis: income budgeted/real/difference in the summary. Route: inline, test-first. Commit:
  `377dabb` (reviewed by the user). Evidence: RED 6 failing (no `income` in `computeMonthAnalysis`,
  no section, screen) → GREEN finance-v2 633/633, tsc clean, eslint only the known warning. Income is its
  own "Ingresos del mes" section after "Resumen del mes", composed from `computeIncomeComparison`. The
  existing section-order test got the new heading added; its rule (next month before deviations) is kept.
- [x] T5 — Verify: tsc, full test suite, lint, build; independent verify if the risk line calls for it.
  Route: inline + `gentle-ai-verify`. Commit: evidence only. Evidence: tsc clean, `npm test` 88 files /
  971 tests, lint 0 errors (the known warning), build OK. Risk: item 1 (stored budget and transaction
  shapes gain optional fields; every budget mutation changed) → independent verify on `main..HEAD`: PASS
  S1-S5 and the four risk checks (data safety, Presupuesto/Análisis consistency, closed months, test
  observability), finance-v2 633/633. Non-blocking notes: an unchanged amount blur still saves a version
  (same as category amounts); no end-to-end screen test edits an income (covered by form + hook tests).

## Log
- L1 (2026-10-11, user): "quiero que en presupuesto tengamos lo presupuestado de ingreo, es decir que
  podamos trackear los ingresos reales vs los presupuestados, no sé si dejarlo en Presupuesto o en otra
  tab para que no sea tanta información, lo otro podría ser una tab con un resumen y que en presupuesto
  dejemos también los ingresos"
- L2 (agent): the Análisis tab already is the summary tab, so no fourth tab was proposed.
- L3 (user): "por fuente"; then "Presupuesto + Análisis (recomendado)", "Opcional (recomendado)",
  "Solo mensual (recomendado)".
- L4 (user): "quiero que revisemos los cambios de cada todo antes de commitear, para entender con calma
  lo que estás haciendo" — stop after each task for the user's review; commit only after it.
- L5 (user, on T3's note that income rows do not show their source): "suma ese cambio".
- L6 (user, manual test after T5): "ya lo probé, al editar salen los montos solamente, no los nombres"
  (screenshot: edit mode shows only full-width amount inputs). Cause: the shared `Input` is `w-full`;
  placed bare in the source row it took 100% and squeezed `InlineNameField` to zero width (the extra
  `w-36` lost to `w-full`). Fix: fixed-width wrapper as in `BudgetCategoryCard`. Layout is invisible to
  jsdom, so no meaningful RED test exists; tests 315/315 presentation, tsc and eslint clean; visual
  confirmed by the user ("ahora quedó perfecto").
