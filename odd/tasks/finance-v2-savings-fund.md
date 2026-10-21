# Feature: finance v2 savings fund

Locator: `odd/tasks/finance-v2-savings-fund.md` · Engram mirror: `odd/finance-v2-savings-fund/tasks`
Branch: `feat/finance-v2-savings-fund`

## Specs

- S1 — "incorporar ahorros en presupuesto, de modo que pueda hacer un tracking mas preciso de lo que se saca del ahorro hacia la cuenta y en qué se está gastando (sería como un nuevo envelope)". A savings fund lives in finance-v2 next to the existing envelope; the existing envelope (`EnvelopeConfig`, `paidFrom: "envelope"`, `transfer`) is untouched.
- S2 — "algo separado con un monto inicial y ya de apoco ir deprecando savings". The fund has its own config (name, openingBalance, openingMonth) and does NOT read the `features/savings` module. Its balance is never stored: derived from `openingBalance` plus transactions since `openingMonth`.
- S3 — "Gasto directo desde ahorro": an expense of ANY category can be marked "paid from savings" at creation (`paidFrom: "savingsFund"`, snapshot, never recomputed). The balance drops and the expense keeps its category.
- S4 — "más un movimiento de retiro opcional para cuando sacás plata sin gastarla todavía": new transaction `type: "withdrawal"` (fund -> main account), not an expense, consumes no budget leaf.
- S5 — (agent design) Deposits into the fund are the existing `type: "savings"` transactions. Balance at end of month = carriedIn + deposits − withdrawn − spent (paidFrom "savingsFund"). Negative balance is a warning only.
- S6 — (agent design, revised in T1) A `paidFrom: "savingsFund"` expense is not charged to the main-account balance but still consumes its budget leaf (so "pending from main" drops by itself; `computePendingFromMain` is unchanged); a `withdrawal` returns money to the main account (`TransactionTotals.withdrawn`, added to `balance`).
- S7 — Feature is off (null config) => finance-v2 behaves exactly as before.

## Tasks

- [x] T1 — S2 S4 S5 S6 S7 — Domain: `SavingsFundConfig`, `withdrawal` type, `paidFrom` union, `computeSavingsFundFlows`, totals + spendRollup exhaustiveness + label. RED (savingsFund import + totals unhandled `withdrawal`) → GREEN; finance-v2 640/640, tsc + prettier clean. pendingFromMain/homeFinanceSummary need no change (S6). Commit: see git log.
- [x] T2 — S2 S7 — Data: `ISavingsFundRepository` port, kv adapter key `finance-v2-savings-fund-config`, `loadSavingsFundCarriedBalance`, validated server actions + barrel + tests. RED (15 failing) → GREEN; finance-v2 655/655, tsc + eslint + prettier clean. `page.tsx` wiring moved to T3 (the screen must accept the props first). Commit: see git log.
- [x] T3a — S2 S5 — `useFinanceV2SavingsFund` hook (mirror copy, L5a) + `toSavingsFundView` + `SavingsFundCard` + `SavingsFundConfigModal` + tests. RED (missing modules) → GREEN 25/25; tsc + prettier clean; each piece reviewed with the user (L5). Commit: see git log.
- [x] T3b — S2 S5 — wiring: `TransactionsTab` (fund above envelope, user-chosen order), `FinanceV2Screen` (hook, view, MonthNav guard, cross-month refresh), `page.tsx` props + tests. RED (4 tab + 5 screen failing) → GREEN; finance-v2 691/691, tsc + eslint + prettier clean. Commit: see git log. — route: inline — commit: pending
- [x] T4 — S3 S4 — Form/row/summary: "pagar desde ahorros" control on expenses, `withdrawal` type option, row labels, hook stamping + tests. finance-v2 718/718, tsc + eslint + prettier clean; reviewed piece by piece with the user. Commit: 1b445e2. — route: inline
- [x] T5 — S1-S7 — Verify: tsc 0, eslint 0 errors (1 pre-existing warning), vitest 1084/1084, next build ok; gentle-ai-verify: S1-S7 all pass, no blockers. Note: kv `load()` does not re-validate the stored shape on read (mirrors the envelope adapter). — route: gentle-ai-verify — commit: n/a

## Log

- L1 — quiero incorporar ahorros en presupuesto, de modo que pueda hacer un tracking mas preciso de lo que se saca del ahorro hacia la cuenta y en qué se está gastando (sería como un nuevo envelope)
- L2 — Será conveniente que los dos features queden tan acoplados? quizás podrímos hacer algo separado con un monto inicial y ya de apoco ir deprecando savings
- L3 — Si, me parece la primera opcion
- L4 — no estás escribiendo las cosas con write y no veo los cambios
- L5a — (decision, user-confirmed) `useFinanceV2SavingsFund` is a deliberate mirror copy of `useFinanceV2Envelope`, not a shared generic hook. Follow-up debt: unify both into one generic carried-balance hook in a separate change, once the fund works.
- L5 — también quiero que revisemos los cambios antes de continuar y que me los vayas explicando y los vayamos entendiendo y que guardes eso en memoria
