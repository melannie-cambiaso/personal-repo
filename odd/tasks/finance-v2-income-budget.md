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
- [ ] T1 — S1, S3, S5 domain: `IncomeSource` + optional `incomeSources` on `BudgetConfig`, shape
  validator, add/rename/set-amount/delete mutations, optional `source` snapshot on income
  transactions, `computeIncomeComparison`. Route: inline, test-first. Commit: — (GREEN, waiting for the
  user's review). Evidence: RED 25 failing (missing module/functions, category edits dropping
  `incomeSources`) → GREEN domain 235/235, finance-v2 598/598, tsc clean. Every existing budget
  mutation now spreads `config`, otherwise a category edit would have deleted the income sources.
- [ ] T2 — S1, S2 Presupuesto: budget hook mutations + income block in `BudgetTab` (view: budgeted vs
  real per source; edit: manage sources). Route: inline, test-first. Commit: —
- [ ] T3 — S3 Movimientos: optional source picker for income in `TransactionForm` (create and edit).
  Route: inline, test-first. Commit: —
- [ ] T4 — S4 Análisis: income budgeted/real/difference in the summary. Route: inline, test-first. Commit: —
- [ ] T5 — Verify: tsc, full test suite, lint, build; independent verify if the risk line calls for it.
  Route: inline + `gentle-ai-verify`. Commit: evidence only.

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
