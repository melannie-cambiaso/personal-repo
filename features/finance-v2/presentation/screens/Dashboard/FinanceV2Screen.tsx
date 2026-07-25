"use client";

import { useState } from "react";
import type { BudgetConfig, FinanceV2Config } from "@/features/finance-v2/domain";
import { useFinanceV2Dashboard } from "../../hooks/useFinanceV2Dashboard";
import { useFinanceV2Budget } from "../../hooks/useFinanceV2Budget";
import { IncomeSplitTab } from "./IncomeSplitTab";
import { BudgetTab } from "../../components/Budget/BudgetTab";
import { PageHeader } from "@/shared/components";

type TabKey = "split" | "budget";

interface Props {
  initialConfig: FinanceV2Config;
  onSave: (config: FinanceV2Config) => Promise<void> | void;
  initialBudget: BudgetConfig;
  onSaveBudget: (budget: BudgetConfig) => Promise<void> | void;
}

// Both `useFinanceV2Dashboard` and `useFinanceV2Budget` stay hoisted here (design decision
// #1): tab 2's comparison needs the LIVE split target after tab-1 edits, and — since the
// tabs are conditionally rendered, not always-mounted — hoisting is what keeps tab 2's
// categories alive across a switch away and back (an internally-owned hook would remount
// from the now-stale `initialBudget` prop and lose anything added after page load).
export function FinanceV2Screen({ initialConfig, onSave, initialBudget, onSaveBudget }: Props) {
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

  const [activeTab, setActiveTab] = useState<TabKey>("split");

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Distribuí tu ingreso" title="Finanzas v2" />

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("split")}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === "split"
                ? "bg-brown-800 text-white"
                : "bg-cream-100 text-brown-600 hover:bg-cream-200"
            }`}
          >
            Distribución
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === "budget"
                ? "bg-brown-800 text-white"
                : "bg-cream-100 text-brown-600 hover:bg-cream-200"
            }`}
          >
            Presupuesto
          </button>
        </div>

        {activeTab === "split" ? (
          <IncomeSplitTab
            config={config}
            split={split}
            onIncomeBlur={handleIncomeBlur}
            onPercentageBlur={handlePercentageBlur}
          />
        ) : (
          <BudgetTab
            categories={categories}
            comparison={comparison}
            onAmountBlur={handleAmountBlur}
            onAddCategory={addCategory}
            onAddSubcategory={addSubcategory}
            onDeleteCategory={deleteCategory}
            onDeleteSubcategory={deleteSubcategory}
          />
        )}
      </div>
    </main>
  );
}
