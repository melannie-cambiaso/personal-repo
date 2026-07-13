# Exploration: Unit-based ("unitario") expense entries with weeks-in-month and multiplier factor

## Current State

- **Budget entry** (`features/finance/presentation/components/Budget/BudgetTab.tsx`, `GroupSection`/`CardsSection`): each category has exactly ONE flat `<input type="number">` per month. On blur it writes directly into `budget[category]` and persists via `onSave` → `saveBudget(month, budget)`.
- **Budget persistence** (`features/finance/data/kvAdapter.ts`): `budget` is stored as `Record<string, number>` under key `finance-budget:{month}` — a flat category → amount map. No concept of a formula, unit price, quantity, or factor exists in this schema today.
- **Real transaction entry** (`features/finance/presentation/components/Transactions/AddTransactionModal.tsx`): a structured form — `Select` (category), `Input type="number"` (amount, via `parseFloat`), optional text `note`. No quantity/factor fields. `FinanceTransaction` (`features/finance/domain/FinanceTransaction.ts`) is `{ id, category, amount, note?, createdAt }` — amount is a single number.
- **Categories**: `DEFAULT_GROUPS` (`features/finance/domain/categories.ts`) already defines `"DBT"` as a real category inside the `"Gastos fijos"` (expense) group — confirms the user's example refers to an existing category, not a placeholder.
- **No shorthand/quick-entry parser exists anywhere in the repo.** Grepped for `parse|shorthand|quick.?entry|regex|DBT` across the codebase — the only "parse" hits are unrelated `parseFloat(amount)` calls in `AddTransactionModal.tsx` and two `home-improvements` modal files. There is no tokenizer, no free-text input field, nothing that turns a string like `"DBT 55k 1 90%"` into structured data. This is a net-new capability, not an extension of existing logic.
- **No "weeks in month" utility exists.** Grepped for `semana|week|getWeeksInMonth|isoWeek` (case-insensitive) across the whole repo — zero matches. `shared/utils/monthUtils.ts` only has `currentMonth()`, `prevMonth()`, `nextMonth()` (string manipulation on `"YYYY-MM"`), nothing calendar-aware. A "weeks in month" concept must be built from scratch, including deciding its algorithm.
- **Downstream consumers of `budget[category]` as a flat number**: `computeBudgetSummary.ts`, `computePendingExpenses.ts` (sums `budget[cat] ?? 0`), `buildBudgetExportRows.ts`, and both `BudgetTableView`/`BudgetCardsView` render paths in `BudgetTab.tsx`. Any change to how a budget number is derived must still resolve to a single `number` for these consumers, unless their signatures also change.

## Affected Areas

- `features/finance/data/kvAdapter.ts` — `budget: Record<string, number>` schema; would need extension (or a parallel key) to persist unit-mode config (unit amount, quantity, factor) per category, otherwise re-editing loses the breakdown.
- `features/finance/presentation/components/Budget/BudgetTab.tsx` (`GroupSection`, `CardsSection`) — the single flat number input is where a "unit mode" toggle/fields would need to live.
- `features/finance/presentation/components/Transactions/AddTransactionModal.tsx` — only relevant if "unitario" also applies to logging real transactions, not just planned budget.
- `features/finance/domain/computeBudgetSummary.ts`, `computePendingExpenses.ts`, `buildBudgetExportRows.ts` — all consume `budget[category]` as a plain number; would need to consume a computed total instead, or stay untouched if computation happens before save.
- `features/finance/domain/categories.ts` — `DBT` already exists here; no category-schema field for "unit mode" currently.
- `shared/utils/monthUtils.ts` — natural home for a new `getWeeksInMonth(month: string): number` helper, but doesn't exist yet; the algorithm (ISO calendar weeks touching the month vs. `daysInMonth / 7`) is undefined and will materially change output.
- `features/finance/data/financeActions.ts` — server action layer wrapping `loadBudget`/`saveBudget`; touchpoint for any schema change.

## Approaches

1. **Compute-only unit mode (no schema change)** — Add an optional "unit mode" toggle per category in `BudgetTab`'s budget input UI. When enabled, show 3 small fields (unit amount, quantity, factor, both defaulting to 1) plus a "use weeks in month" checkbox; on blur, compute `unitAmount × quantity × factor × (weeksInMonth or 1)` and write the resulting number into `budget[category]`, exactly as today.
   - Pros: Zero persistence/schema change; smallest blast radius; every downstream consumer (`computeBudgetSummary`, `computePendingExpenses`, export) needs no changes; easy rollback (just remove the UI toggle).
   - Cons: The unit breakdown is NOT saved — reopening the category shows only the flat total, and editing means re-entering unit amount/qty/factor from scratch every month.
   - Effort: Medium

2. **Persisted unit config (schema extension)** — Extend the budget schema to store both the flat total AND a per-category unit config, e.g. a new KV key `finance-budget-unit-config:{month}` mapping category → `{ unitAmount, quantity, factor, useWeeksInMonth }`, with `budget[category]` continuing to hold the derived flat number as today (recomputed on save, or reactively on read).
   - Pros: Full fidelity — users can reopen and edit the breakdown across months; supports automatic recompute when weeks-in-month changes (e.g. copying budget to a month with a different week count, via the existing "Copiar desde" feature in `BudgetTab.tsx`).
   - Cons: New KV schema + back-compat concern for months that already have flat-only data; touches `kvAdapter.ts`, `financeActions.ts`, and needs a decision on whether `computeBudgetSummary`/`computePendingExpenses` read the derived number or recompute from config at read time.
   - Effort: High

3. **Free-text shorthand parser (literal `"DBT 55k 1 90%"` string entry)** — Build a new tokenizer/parser mapped onto either budget or transaction entry that accepts a single text string and extracts category + unit amount + quantity + factor.
   - Pros: Matches the user's literal example most directly; potentially very fast data entry once trained.
   - Cons: Zero precedent in the codebase (verified by grep) — every other input in this app is structured (`Select` + typed `Input`), not free text; introduces a new mini-language with its own error handling for malformed strings, unit suffixes (`"55k"` → 55000), and the token-order ambiguity below becomes a parsing-time correctness bug, not just a spec question.
   - Effort: High

## Recommendation

Approach 1 (compute-only) is the safer default if the unit breakdown doesn't need to survive across edits — it reuses the existing `Record<string, number>` schema untouched and every domain function keeps working as-is. However, given the user explicitly described defaults ("factor por defecto 1, al igual que la cantidad") as first-class, reusable concepts, Approach 2 is likely closer to what's actually wanted, since compute-only throws away the very inputs (`unitAmount`, `quantity`, `factor`) the user is asking to define — but this is a scope decision for the user, not something to infer. Approach 3 should be deferred unless the user confirms they specifically want literal free-text shorthand input (not just a conceptual example) — nothing in this codebase supports that today and it's the highest-risk, highest-effort path for what may just be shorthand notation in the user's head, not a UI requirement.

## Risks / Open Questions (deliberately unresolved — for sdd-propose)

1. **Scope: budget or transactions, or both?** The example token pattern doesn't cleanly map onto either existing form (`BudgetTab`'s single number input, or `AddTransactionModal`'s category+amount+note). Does "unitario" apply to the planned/budget figure, the real/transaction figure, or both?
2. **Formula ambiguity.** Is the total `weeksInMonth × unitAmount × quantity × factor`, or is "depend on weeks in month" a separate optional toggle independent of quantity/factor? The user's phrasing lists these as three separate dependencies without stating the combining formula.
3. **Token-order ambiguity in the example itself.** In `"DBT 55k 1 90%"`, is the `1` the quantity and `90%` the factor, or vice versa? The user states both default to `1`, but the example shows one explicit `1` and one explicit `90%` — at least one is a non-default override, and the mapping isn't stated.
4. **Semantic ambiguity of "90%".** Is it a generic multiplication factor (`0.9`), or something domain-specific like an insurance copay/coverage percentage (plausible, since DBT is a psychiatric therapy category)? These would have the same arithmetic but different UI labels and validation rules.
5. **"Weeks in month" algorithm is undefined and has no precedent in this codebase.** ISO calendar weeks touching the month (can yield 4, 5, or 6) vs. a fixed `daysInMonth / 7` (~4.28, non-integer) produce materially different totals — needs an explicit decision.
6. **Persistence fidelity vs. schema change** (see Approaches 1 vs. 2) — losing the unit breakdown on save is a real UX regression if users expect to re-edit it monthly, especially combined with the existing "Copiar desde" (copy budget from a previous month) feature, which currently just copies flat numbers.
7. **Free text vs. structured UI** — is `"DBT 55k 1 90%"` meant to become an actual free-text input field, or is it just the user's shorthand for describing 4 structured values (category, unit amount, quantity, factor) that should get 4 separate form fields? This materially changes effort (Approach 3 vs. 1/2).

## Ready for Proposal

Partial. The codebase mapping (affected files, existing schema, absence of any parser or weeks-in-month utility) is fully scoped and unambiguous. But the business semantics of the feature — formula, token order, "90%" meaning, and persistence-fidelity expectations — are not resolvable from the codebase or the request as stated. Recommend `sdd-propose` either ask the user to clarify items 1-4 and 7 above before drafting the proposal, or draft the proposal with these as explicit open decisions requiring sign-off before `sdd-spec`.
