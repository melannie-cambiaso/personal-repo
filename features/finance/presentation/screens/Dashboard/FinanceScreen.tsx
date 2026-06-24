"use client";

import { useState, useEffect } from "react";
import { getBudgetForMonth, getActualForMonth, addCategory, deleteCategory } from "@/features/finance/data/financeActions";
import { type Group } from "@/features/finance/data/kvAdapter";
import { BudgetTab, CategoriesTab, FinanceMonthNav } from "../../components";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";

interface Props {
  initialBudget: Record<string, number>;
  initialActual: Record<string, number>;
  initialCategories: Group[];
  onSaveBudget: (month: string, budget: Record<string, number>) => Promise<void>;
  onSaveActual: (month: string, actual: Record<string, number>) => Promise<void>;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
}

function nextMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
}

export function FinanceScreen({ initialBudget, initialActual, initialCategories, onSaveBudget, onSaveActual }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth());
  const [monthBudget, setMonthBudget] = useState<Record<string, number>>(initialBudget);
  const [monthActual, setMonthActual] = useState<Record<string, number>>(initialActual);
  const [budgetLoadedFor, setBudgetLoadedFor] = useState(selectedMonth);
  const [groups, setGroups] = useState<Group[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<"budget" | "categories">("budget");

  useEffect(() => {
    if (budgetLoadedFor === selectedMonth) return;
    Promise.all([
      getBudgetForMonth(selectedMonth),
      getActualForMonth(selectedMonth),
    ]).then(([b, a]) => {
      setMonthBudget(b);
      setMonthActual(a);
      setBudgetLoadedFor(selectedMonth);
    });
  }, [selectedMonth, budgetLoadedFor]);

  const handleAddCategory = async (groupName: string, category: string): Promise<void> => {
    // Optimistic update
    setGroups((prev) =>
      prev.map((g) =>
        g.name === groupName ? { ...g, categories: [...g.categories, category] } : g
      )
    );
    try {
      await addCategory(groupName, category);
    } catch (err) {
      // Revert on failure
      setGroups((prev) =>
        prev.map((g) =>
          g.name === groupName
            ? { ...g, categories: g.categories.filter((c) => c !== category) }
            : g
        )
      );
      throw err;
    }
  };

  const handleDeleteCategory = async (groupName: string, category: string): Promise<void> => {
    // Optimistic update
    setGroups((prev) =>
      prev.map((g) =>
        g.name === groupName ? { ...g, categories: g.categories.filter((c) => c !== category) } : g
      )
    );
    try {
      await deleteCategory(groupName, category);
    } catch (err) {
      // Revert on failure
      setGroups((prev) =>
        prev.map((g) =>
          g.name === groupName ? { ...g, categories: [...g.categories, category] } : g
        )
      );
      throw err;
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Tus finanzas" title="Finanzas" />

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <div className="mb-6 flex gap-2">
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
          <button
            onClick={() => setActiveTab("categories")}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === "categories"
                ? "bg-brown-800 text-white"
                : "bg-cream-100 text-brown-600 hover:bg-cream-200"
            }`}
          >
            Categorías
          </button>
        </div>

        {activeTab === "budget" && (
          <>
            <FinanceMonthNav
              selectedMonth={selectedMonth}
              onPrev={() => setSelectedMonth(prevMonth(selectedMonth))}
              onNext={() => setSelectedMonth(nextMonth(selectedMonth))}
            />

            <BudgetTab
              key={budgetLoadedFor}
              groups={groups}
              initialBudget={monthBudget}
              initialActual={monthActual}
              selectedMonth={selectedMonth}
              onSave={(b) => onSaveBudget(selectedMonth, b)}
              onSaveActual={(a) => onSaveActual(selectedMonth, a)}
            />
          </>
        )}

        {activeTab === "categories" && (
          <CategoriesTab
            groups={groups}
            onAdd={handleAddCategory}
            onDelete={handleDeleteCategory}
          />
        )}
      </div>
    </main>
  );
}
