"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  BudgetConfig,
  BudgetVersion,
  EnvelopeConfig,
  FinanceV2Transaction,
} from "@/features/finance-v2/domain";
import {
  computeIncomeComparison,
  computeMonthAnalysis,
  computePendingByCategory,
  computePendingFromMain,
  computeSpendComparison,
  listExpenseCategoryOptions,
  resolvePaidFrom,
} from "@/features/finance-v2/domain";
import { useFinanceV2Budget } from "../../hooks/useFinanceV2Budget";
import { useFinanceV2Envelope } from "../../hooks/useFinanceV2Envelope";
import { useFinanceV2Transactions } from "../../hooks/useFinanceV2Transactions";
import { BudgetTab } from "../../components/Budget/BudgetTab";
import { IncomeBudget } from "../../components/Budget/IncomeBudget";
import { AnalysisTab } from "../../components/Analysis/AnalysisTab";
import { TransactionsTab } from "../../components/Transactions/TransactionsTab";
import type { BudgetMode } from "../../components/Budget/budgetMode";
import { toSpendView } from "../../components/Budget/spendView";
import { toAccountCoverageView } from "../../components/Budget/accountCoverageView";
import { toEnvelopeView } from "../../components/Transactions/Envelope/envelopeView";
import { PageHeader, MonthNav } from "@/shared/components";
import { FINANCE_V2_SECTIONS, SECTION_PARAM, resolveSection } from "@/shared/navigation/features";
import { formatMonth } from "@/shared/utils/formatMonth";
import { prevMonth, nextMonth } from "@/shared/utils/monthUtils";

interface Props {
  initialBudgetVersions: BudgetVersion[];
  onSaveBudget: (month: string, budget: BudgetConfig) => Promise<void> | void;
  initialTransactions: FinanceV2Transaction[];
  /** The page's `currentMonth()`: the first month viewed, and the boundary before which
   *  a month's budget is closed (read-only). */
  initialMonth: string;
  onSaveTransactions: (month: string, transactions: FinanceV2Transaction[]) => Promise<void> | void;
  onSaveToOtherMonth: (tx: FinanceV2Transaction) => Promise<void> | void;
  onLoadTransactions: (month: string) => Promise<FinanceV2Transaction[]>;
  initialEnvelopeConfig: EnvelopeConfig | null;
  initialCarriedIn: number | null;
  onSaveEnvelopeConfig: (config: EnvelopeConfig) => Promise<void> | void;
  onLoadEnvelopeCarriedBalance: (month: string) => Promise<number | null>;
}

// `useFinanceV2Budget` and `useFinanceV2Transactions` stay hoisted here (design decision
// #1): tab 2's category picker needs the LIVE budget categories after tab-1 edits, and —
// since the tabs are conditionally rendered, not always-mounted — hoisting is what keeps
// each tab's state alive across a switch away and back (an internally-owned hook would
// remount from a now-stale `initial*` prop and lose anything added since page load).
// The budget is versioned by month: `categories` below is always the version in force
// for `viewedMonth`, so every consumer pairs a month with its own budget.
export function FinanceV2Screen({
  initialBudgetVersions,
  onSaveBudget,
  initialTransactions,
  initialMonth,
  onSaveTransactions,
  onSaveToOtherMonth,
  onLoadTransactions,
  initialEnvelopeConfig,
  initialCarriedIn,
  onSaveEnvelopeConfig,
  onLoadEnvelopeCarriedBalance,
}: Props) {
  // Hoisted (design decision #1): tabs are conditionally rendered, so month state must
  // survive a tab switch. `setViewedMonth` is wired into `TransactionsTab`'s
  // `onChangeMonth` below, driving the prev/next controls.
  const [viewedMonth, setViewedMonth] = useState(initialMonth);

  const {
    categories,
    incomeSources,
    addIncomeSource,
    renameIncomeSource,
    handleIncomeAmountBlur,
    deleteIncomeSource,
    addCategory,
    addSubcategory,
    deleteCategory,
    deleteSubcategory,
    renameCategory,
    renameSubcategory,
    handleAmountBlur,
    handleFrequencyChange,
    handleWeekdayChange,
  } = useFinanceV2Budget({
    initialVersions: initialBudgetVersions,
    month: viewedMonth,
    onSave: onSaveBudget,
  });
  // A month before the current one has a closed budget. Compared against the server's
  // `currentMonth()` (passed as `initialMonth`) rather than the client clock, so the
  // server render and hydration always agree.
  const isClosedMonth = viewedMonth < initialMonth;

  // Hoisted for the same reason as the two hooks around it. Declared before
  // `useFinanceV2Transactions`, which needs its config to stamp new expenses.
  const {
    config: envelopeConfig,
    saveConfig: saveEnvelopeConfig,
    carriedIn,
    isLoadingCarried,
    refreshCarried,
  } = useFinanceV2Envelope({
    initialConfig: initialEnvelopeConfig,
    initialCarriedIn,
    viewedMonth,
    onSaveConfig: onSaveEnvelopeConfig,
    onLoadCarriedBalance: onLoadEnvelopeCarriedBalance,
  });

  const {
    transactions,
    totals,
    dayGroups,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    lastCrossMonthSave,
    dismissCrossMonthSave,
    isLoadingMonth,
  } = useFinanceV2Transactions({
    initialTransactions,
    viewedMonth,
    onSave: onSaveTransactions,
    onSaveToOtherMonth,
    onLoad: onLoadTransactions,
    // Against the LIVE budget (design D1): a subcategory added in the Presupuesto tab
    // this session must already be envelope-paid.
    resolvePaidFrom: (categoryId) => resolvePaidFrom(envelopeConfig, { categories }, categoryId),
    // Only an earlier month feeds the viewed month's carried-in balance.
    onCrossMonthSaved: (month) => {
      if (month < viewedMonth) refreshCarried();
    },
  });

  // Flows LIVE from the hoisted budget hook: a subcategory added in tab 2 is pickable in
  // tab 3 without a reload (same rationale as design decision #1).
  const categoryOptions = useMemo(() => listExpenseCategoryOptions({ categories }), [categories]);
  // Same LIVE flow for income: a source added on Presupuesto is pickable right away. Only
  // the snapshot fields (`id`, `name`) reach a transaction, never the budgeted amount.
  const incomeSourceOptions = useMemo(
    () => incomeSources.map(({ id, name }) => ({ id, name })),
    [incomeSources]
  );

  // Actuals counterpart to the budget (design D7): month-agnostic and pure, so it is
  // memoized on categories and transactions plus the viewed month.
  // `isLoadingMonth` is applied OUTSIDE the memo (via `toSpendView`) — it is a cheap
  // wrap, not worth widening the memo's dependency list.
  const spendComparison = useMemo(
    () => computeSpendComparison({ categories }, transactions, viewedMonth),
    [categories, transactions, viewedMonth]
  );
  const spend = toSpendView(isLoadingMonth, spendComparison);

  // Same axes as `spendComparison` (plus the envelope, whose bound leaves it excludes),
  // paired with `totals.balance` from the very same transaction list so both sides of
  // the coverage block describe one month. `isLoadingMonth` is applied outside the
  // memo, as with `toSpendView`.
  const pendingFromMain = useMemo(
    () => computePendingFromMain({ categories }, transactions, viewedMonth, envelopeConfig),
    [categories, transactions, viewedMonth, envelopeConfig]
  );
  // Same axes; the per-category figure the cards' "quedan" add up to (display only).
  const pendingByCategory = useMemo(
    () => computePendingByCategory({ categories }, transactions, viewedMonth, envelopeConfig),
    [categories, transactions, viewedMonth, envelopeConfig]
  );
  // Same viewed month and transaction list as `spendComparison`, so income and spend on
  // the Presupuesto tab always describe one month. `isLoadingMonth` is applied where the
  // prop is passed, as with `toSpendView`.
  const incomeComparison = useMemo(
    () => computeIncomeComparison({ categories, incomeSources }, transactions),
    [categories, incomeSources, transactions]
  );

  const coverage = toAccountCoverageView({
    isLoadingMonth,
    pendingByCategory,
    pending: pendingFromMain,
    balance: totals.balance,
    envelope: envelopeConfig,
    categories,
  });

  // Memoized on the same axes as `spendComparison` — it composes the very same
  // rollups, so the Analysis tab can never disagree with the Budget tab. As with
  // `toSpendView` above, `isLoadingMonth` stays OUT of the dependency list and is
  // applied where the prop is passed.
  const monthAnalysis = useMemo(
    () => computeMonthAnalysis({ categories, incomeSources }, transactions, viewedMonth),
    [categories, incomeSources, transactions, viewedMonth]
  );

  // Derived on every render (cheap, no memo): the flows read the possibly-optimistic
  // list, and either loading flag hides the card and reminder via `carriedIn: null`.
  const envelope = toEnvelopeView({
    config: envelopeConfig,
    carriedIn,
    isLoading: isLoadingMonth || isLoadingCarried,
    transactions,
    budget: { categories },
    month: viewedMonth,
  });

  // The section is chosen from the app menu (`AppNav`) and lives in the URL, so it
  // survives a reload and can be linked to. Missing or unknown values fall back to
  // Presupuesto.
  const activeTab = resolveSection(FINANCE_V2_SECTIONS, useSearchParams().get(SECTION_PARAM));
  const activeSection =
    FINANCE_V2_SECTIONS.find((s) => s.key === activeTab) ?? FINANCE_V2_SECTIONS[0];
  // Hoisted beside `useFinanceV2Budget` (same remount rationale as design decision #1):
  // the Budget tab is conditionally rendered, so mode state must live here, not inside
  // `BudgetTab`, to survive a switch away and back. Default lives ONLY here — `mode` is
  // a required prop everywhere else.
  const [budgetMode, setBudgetMode] = useState<BudgetMode>("view");
  const toggleBudgetMode = () => setBudgetMode((m) => (m === "view" ? "edit" : "view"));

  // Lifted from `TransactionsTab` (design D6): `MonthNav` is now a single control shared
  // by the Presupuesto and Movimientos tabs, so this flag — its `disabled` guard — had to
  // move up with it (see `TransactionsTab`'s header comment for the correctness rationale).
  const [isAddOpen, setIsAddOpen] = useState(false);
  // Edit reuses the add modal and its `isAddOpen` MonthNav guard; `null` = add mode.
  const [editingTransaction, setEditingTransaction] = useState<FinanceV2Transaction | null>(null);
  // Same guard: creating the envelope stamps `openingMonth` from `viewedMonth`.
  const [isEnvelopeConfigOpen, setIsEnvelopeConfigOpen] = useState(false);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Finanzas v2" title={activeSection.label}>
        {/* Full width on phones, where the header wraps it under the title. */}
        <div className="w-full sm:w-auto">
          <MonthNav
            label={formatMonth(viewedMonth)}
            onPrev={() => setViewedMonth(prevMonth(viewedMonth))}
            onNext={() => setViewedMonth(nextMonth(viewedMonth))}
            disabled={isAddOpen || isEnvelopeConfigOpen}
          />
        </div>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-10 sm:px-6">
        {activeTab === "budget" && (
          <BudgetTab
            // A closed month forces view mode; `budgetMode` itself is kept, so moving
            // back to an editable month restores it.
            mode={isClosedMonth ? "view" : budgetMode}
            readOnly={isClosedMonth}
            onToggleMode={toggleBudgetMode}
            categories={categories}
            month={viewedMonth}
            spend={spend}
            coverage={coverage}
            income={
              <IncomeBudget
                mode={isClosedMonth ? "view" : budgetMode}
                sources={incomeSources}
                income={isLoadingMonth ? null : incomeComparison}
                onAdd={addIncomeSource}
                onRename={renameIncomeSource}
                onAmountBlur={handleIncomeAmountBlur}
                onDelete={deleteIncomeSource}
              />
            }
            onAmountBlur={handleAmountBlur}
            onAddCategory={addCategory}
            onAddSubcategory={addSubcategory}
            onDeleteCategory={deleteCategory}
            onDeleteSubcategory={deleteSubcategory}
            onFrequencyChange={handleFrequencyChange}
            onWeekdayChange={handleWeekdayChange}
            onRenameCategory={renameCategory}
            onRenameSubcategory={renameSubcategory}
          />
        )}

        {activeTab === "analysis" && (
          <AnalysisTab analysis={isLoadingMonth ? null : monthAnalysis} />
        )}

        {activeTab === "movements" && (
          <TransactionsTab
            viewedMonth={viewedMonth}
            totals={totals}
            dayGroups={dayGroups}
            categoryOptions={categoryOptions}
            incomeSourceOptions={incomeSourceOptions}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
            onUpdate={updateTransaction}
            editingTransaction={editingTransaction}
            onEdit={(tx) => {
              setEditingTransaction(tx);
              setIsAddOpen(true);
            }}
            lastCrossMonthSave={lastCrossMonthSave}
            onDismissCrossMonthSave={dismissCrossMonthSave}
            isAddOpen={isAddOpen}
            onOpenAdd={() => {
              setEditingTransaction(null);
              setIsAddOpen(true);
            }}
            onCloseAdd={() => {
              setIsAddOpen(false);
              setEditingTransaction(null);
            }}
            envelope={envelope}
            budgetCategories={categories}
            onSaveEnvelopeConfig={saveEnvelopeConfig}
            isEnvelopeConfigOpen={isEnvelopeConfigOpen}
            onOpenEnvelopeConfig={() => setIsEnvelopeConfigOpen(true)}
            onCloseEnvelopeConfig={() => setIsEnvelopeConfigOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
