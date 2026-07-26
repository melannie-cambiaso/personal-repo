"use client";

import { useMemo, useState } from "react";
import type { BudgetConfig, FinanceV2Config, FinanceV2Transaction } from "@/features/finance-v2/domain";
import { listExpenseCategoryOptions } from "@/features/finance-v2/domain";
import { useFinanceV2Dashboard } from "../../hooks/useFinanceV2Dashboard";
import { useFinanceV2Budget } from "../../hooks/useFinanceV2Budget";
import { useFinanceV2Transactions } from "../../hooks/useFinanceV2Transactions";
import { IncomeSplitTab } from "./IncomeSplitTab";
import { BudgetTab } from "../../components/Budget/BudgetTab";
import { TransactionsTab } from "../../components/Transactions/TransactionsTab";
import type { BudgetMode } from "../../components/Budget/budgetMode";
import { PageHeader } from "@/shared/components";

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
  month: string;
  onSaveTransactions: (month: string, transactions: FinanceV2Transaction[]) => Promise<void> | void;
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
  month,
  onSaveTransactions,
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
  } = useFinanceV2Budget({ initialBudget, split, onSave: onSaveBudget });

  const { totals, dayGroups, addTransaction, deleteTransaction } = useFinanceV2Transactions({
    initialTransactions,
    month,
    onSave: onSaveTransactions,
  });

  // Flows LIVE from the hoisted budget hook: a subcategory added in tab 2 is pickable in
  // tab 3 without a reload (same rationale as design decision #1).
  const categoryOptions = useMemo(() => listExpenseCategoryOptions({ categories }), [categories]);

  const [activeTab, setActiveTab] = useState<TabKey>("split");
  // Hoisted beside `useFinanceV2Budget` (same remount rationale as design decision #1):
  // the Budget tab is conditionally rendered, so mode state must live here, not inside
  // `BudgetTab`, to survive a switch away and back. Default lives ONLY here — `mode` is
  // a required prop everywhere else.
  const [budgetMode, setBudgetMode] = useState<BudgetMode>("view");
  const toggleBudgetMode = () => setBudgetMode((m) => (m === "view" ? "edit" : "view"));

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
            onAmountBlur={handleAmountBlur}
            onAddCategory={addCategory}
            onAddSubcategory={addSubcategory}
            onDeleteCategory={deleteCategory}
            onDeleteSubcategory={deleteSubcategory}
          />
        )}

        {activeTab === "movements" && (
          <TransactionsTab
            month={month}
            totals={totals}
            dayGroups={dayGroups}
            categoryOptions={categoryOptions}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
          />
        )}
      </div>
    </main>
  );
}
