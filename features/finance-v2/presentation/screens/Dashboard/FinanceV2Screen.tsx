"use client";

import { useMemo, useState } from "react";
import type {
  BudgetConfig,
  EnvelopeConfig,
  FinanceV2Transaction,
} from "@/features/finance-v2/domain";
import {
  computeMonthAnalysis,
  computePendingFromMain,
  computeSpendComparison,
  listExpenseCategoryOptions,
  resolvePaidFrom,
} from "@/features/finance-v2/domain";
import { useFinanceV2Budget } from "../../hooks/useFinanceV2Budget";
import { useFinanceV2Envelope } from "../../hooks/useFinanceV2Envelope";
import { useFinanceV2Transactions } from "../../hooks/useFinanceV2Transactions";
import { BudgetTab } from "../../components/Budget/BudgetTab";
import { AnalysisTab } from "../../components/Analysis/AnalysisTab";
import { TransactionsTab } from "../../components/Transactions/TransactionsTab";
import type { BudgetMode } from "../../components/Budget/budgetMode";
import { toSpendView } from "../../components/Budget/spendView";
import { toAccountCoverageView } from "../../components/Budget/accountCoverageView";
import { toEnvelopeView } from "../../components/Transactions/Envelope/envelopeView";
import { PageHeader, MonthNav } from "@/shared/components";
import { formatMonth } from "@/shared/utils/formatMonth";
import { prevMonth, nextMonth } from "@/shared/utils/monthUtils";

type TabKey = "budget" | "movements" | "analysis";

const TABS: { key: TabKey; label: string }[] = [
  { key: "budget", label: "Presupuesto" },
  { key: "movements", label: "Movimientos" },
  { key: "analysis", label: "Análisis" },
];

interface Props {
  initialBudget: BudgetConfig;
  onSaveBudget: (budget: BudgetConfig) => Promise<void> | void;
  initialTransactions: FinanceV2Transaction[];
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
export function FinanceV2Screen({
  initialBudget,
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
  // `onChangeMonth` below, driving the prev/next controls. Declared before
  // `useFinanceV2Budget` because that hook's `comparison` is month-aware (weekly budget
  // leaves depend on the number of weeks in the viewed month).
  const [viewedMonth, setViewedMonth] = useState(initialMonth);

  const {
    categories,
    comparison,
    addCategory,
    addSubcategory,
    deleteCategory,
    deleteSubcategory,
    handleAmountBlur,
    handleFrequencyChange,
    handleWeekdayChange,
  } = useFinanceV2Budget({ initialBudget, month: viewedMonth, onSave: onSaveBudget });

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

  // Actuals counterpart to `comparison` (design D7): month-agnostic and pure, so it is
  // memoized on the same axes `useFinanceV2Budget`'s `comparison` already relies on plus
  // the loaded transaction list. `isLoadingMonth` is applied OUTSIDE the memo (via
  // `toSpendView`) — it is a cheap wrap, not worth widening the memo's dependency list.
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
  const coverage = toAccountCoverageView({
    isLoadingMonth,
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
    () => computeMonthAnalysis({ categories }, transactions, viewedMonth),
    [categories, transactions, viewedMonth]
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

  const [activeTab, setActiveTab] = useState<TabKey>("budget");
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
      <PageHeader eyebrow="Gestioná tu presupuesto" title="Finanzas v2" />

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`cursor-pointer rounded-full border-2 px-4 py-1.5 transition-colors ${
                activeTab === tab.key
                  ? "border-sage-500 bg-sage-500 text-sage-800"
                  : "border-sage-300 bg-cream-50 text-brown-600 hover:bg-sage-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <MonthNav
          label={formatMonth(viewedMonth)}
          onPrev={() => setViewedMonth(prevMonth(viewedMonth))}
          onNext={() => setViewedMonth(nextMonth(viewedMonth))}
          disabled={isAddOpen || isEnvelopeConfigOpen}
        />

        {activeTab === "budget" && (
          <BudgetTab
            mode={budgetMode}
            onToggleMode={toggleBudgetMode}
            categories={categories}
            month={viewedMonth}
            comparison={comparison}
            spend={spend}
            coverage={coverage}
            onAmountBlur={handleAmountBlur}
            onAddCategory={addCategory}
            onAddSubcategory={addSubcategory}
            onDeleteCategory={deleteCategory}
            onDeleteSubcategory={deleteSubcategory}
            onFrequencyChange={handleFrequencyChange}
            onWeekdayChange={handleWeekdayChange}
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
