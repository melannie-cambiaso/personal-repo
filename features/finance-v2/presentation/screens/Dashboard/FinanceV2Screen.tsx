"use client";

import { useMemo, useState } from "react";
import type { BudgetConfig, FinanceV2Config, FinanceV2Transaction } from "@/features/finance-v2/domain";
import { computeSpendComparison, listExpenseCategoryOptions } from "@/features/finance-v2/domain";
import { useFinanceV2Dashboard } from "../../hooks/useFinanceV2Dashboard";
import { useFinanceV2Budget } from "../../hooks/useFinanceV2Budget";
import { useFinanceV2Transactions } from "../../hooks/useFinanceV2Transactions";
import { IncomeSplitTab } from "./IncomeSplitTab";
import { BudgetTab } from "../../components/Budget/BudgetTab";
import { TransactionsTab } from "../../components/Transactions/TransactionsTab";
import type { BudgetMode } from "../../components/Budget/budgetMode";
import { toSpendView } from "../../components/Budget/spendView";
import { PageHeader, MonthNav } from "@/shared/components";
import { formatMonth } from "@/shared/utils/formatMonth";
import { prevMonth, nextMonth } from "@/shared/utils/monthUtils";

type TabKey = "split" | "budget" | "movements";

const TABS: { key: TabKey; label: string }[] = [
  { key: "split", label: "Distribución" },
  { key: "budget", label: "Presupuesto" },
  { key: "movements", label: "Movimientos" },
];

interface Props {
  initialConfig: FinanceV2Config;
  onSave: (config: FinanceV2Config) => Promise<void> | void;
  initialBudget: BudgetConfig;
  onSaveBudget: (budget: BudgetConfig) => Promise<void> | void;
  initialTransactions: FinanceV2Transaction[];
  initialMonth: string;
  onSaveTransactions: (month: string, transactions: FinanceV2Transaction[]) => Promise<void> | void;
  onSaveToOtherMonth: (tx: FinanceV2Transaction) => Promise<void> | void;
  onLoadTransactions: (month: string) => Promise<FinanceV2Transaction[]>;
}

// `useFinanceV2Dashboard`, `useFinanceV2Budget`, and `useFinanceV2Transactions` all stay
// hoisted here (design decision #1): tab 2's comparison needs the LIVE split target after
// tab-1 edits, tab 3's category picker needs the LIVE budget categories after tab-2 edits,
// and — since the tabs are conditionally rendered, not always-mounted — hoisting is what
// keeps each tab's state alive across a switch away and back (an internally-owned hook
// would remount from a now-stale `initial*` prop and lose anything added since page load).
export function FinanceV2Screen({
  initialConfig,
  onSave,
  initialBudget,
  onSaveBudget,
  initialTransactions,
  initialMonth,
  onSaveTransactions,
  onSaveToOtherMonth,
  onLoadTransactions,
}: Props) {
  const { config, split, handleIncomeBlur, handlePercentageBlur } = useFinanceV2Dashboard({
    initialConfig,
    onSave,
  });

  const {
    categories,
    comparison,
    addCategory,
    addSubcategory,
    deleteCategory,
    deleteSubcategory,
    handleAmountBlur,
  } = useFinanceV2Budget({ initialBudget, onSave: onSaveBudget });

  // Hoisted (design decision #1): tabs are conditionally rendered, so month state must
  // survive a tab switch. `setViewedMonth` is wired into `TransactionsTab`'s
  // `onChangeMonth` below, driving the prev/next controls.
  const [viewedMonth, setViewedMonth] = useState(initialMonth);

  const {
    transactions,
    totals,
    dayGroups,
    addTransaction,
    deleteTransaction,
    lastCrossMonthSave,
    dismissCrossMonthSave,
    isLoadingMonth,
  } = useFinanceV2Transactions({
    initialTransactions,
    viewedMonth,
    onSave: onSaveTransactions,
    onSaveToOtherMonth,
    onLoad: onLoadTransactions,
  });

  // Flows LIVE from the hoisted budget hook: a subcategory added in tab 2 is pickable in
  // tab 3 without a reload (same rationale as design decision #1).
  const categoryOptions = useMemo(() => listExpenseCategoryOptions({ categories }), [categories]);

  // Actuals counterpart to `comparison` (design D7): month-agnostic and pure, so it is
  // memoized on the same axes `useFinanceV2Budget`'s `comparison` already relies on plus
  // the loaded transaction list. `isLoadingMonth` is applied OUTSIDE the memo (via
  // `toSpendView`) — it is a cheap wrap, not worth widening the memo's dependency list.
  const spendComparison = useMemo(
    () => computeSpendComparison({ categories }, transactions),
    [categories, transactions]
  );
  const spend = toSpendView(isLoadingMonth, spendComparison);

  const [activeTab, setActiveTab] = useState<TabKey>("split");
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

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Distribuí tu ingreso" title="Finanzas v2" />

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-brown-800 text-white"
                  : "bg-cream-100 text-brown-600 hover:bg-cream-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* `split` has no month axis (design D6) — hidden there, shared by the other two. */}
        {activeTab !== "split" && (
          <MonthNav
            label={formatMonth(viewedMonth)}
            onPrev={() => setViewedMonth(prevMonth(viewedMonth))}
            onNext={() => setViewedMonth(nextMonth(viewedMonth))}
            disabled={isAddOpen}
          />
        )}

        {activeTab === "split" && (
          <IncomeSplitTab
            config={config}
            split={split}
            onIncomeBlur={handleIncomeBlur}
            onPercentageBlur={handlePercentageBlur}
          />
        )}

        {activeTab === "budget" && (
          <BudgetTab
            mode={budgetMode}
            onToggleMode={toggleBudgetMode}
            categories={categories}
            comparison={comparison}
            spend={spend}
            onAmountBlur={handleAmountBlur}
            onAddCategory={addCategory}
            onAddSubcategory={addSubcategory}
            onDeleteCategory={deleteCategory}
            onDeleteSubcategory={deleteSubcategory}
          />
        )}

        {activeTab === "movements" && (
          <TransactionsTab
            viewedMonth={viewedMonth}
            totals={totals}
            dayGroups={dayGroups}
            categoryOptions={categoryOptions}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
            lastCrossMonthSave={lastCrossMonthSave}
            onDismissCrossMonthSave={dismissCrossMonthSave}
            isAddOpen={isAddOpen}
            onOpenAdd={() => setIsAddOpen(true)}
            onCloseAdd={() => setIsAddOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
