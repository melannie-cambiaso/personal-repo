"use client";

import { useState, useEffect } from "react";
import { getBudgetForMonth, getTransactionsForMonth, addTransaction, deleteTransaction, addCategory, deleteCategory } from "@/features/finance/data/financeActions";
import { type Group } from "@/features/finance/data/kvAdapter";
import type { FinanceTransaction } from "@/features/finance/domain";
import { BudgetTab, CategoriesTab, FinanceMonthNav, AddTransactionModal, TransactionsTab } from "../../components";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { currentMonth, prevMonth, nextMonth } from "@/shared/utils/monthUtils";

interface Props {
  initialBudget: Record<string, number>;
  initialTransactions: FinanceTransaction[];
  initialCategories: Group[];
  onSaveBudget: (month: string, budget: Record<string, number>) => Promise<void>;
}


export function FinanceScreen({ initialBudget, initialTransactions, initialCategories, onSaveBudget }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth());
  const [monthBudget, setMonthBudget] = useState<Record<string, number>>(initialBudget);
  const [budgetLoadedFor, setBudgetLoadedFor] = useState(selectedMonth);
  const [groups, setGroups] = useState<Group[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<"budget" | "categories" | "transactions">("budget");
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(initialTransactions);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [activeTxCategory, setActiveTxCategory] = useState("");

  useEffect(() => {
    if (budgetLoadedFor === selectedMonth) return;
    Promise.all([
      getBudgetForMonth(selectedMonth),
      getTransactionsForMonth(selectedMonth),
    ]).then(([b, txs]) => {
      setMonthBudget(b);
      setTransactions(txs);
      setBudgetLoadedFor(selectedMonth);
    });
  }, [selectedMonth, budgetLoadedFor]);

  const handleOpenTransaction = (category: string) => {
    setActiveTxCategory(category);
    setIsTxModalOpen(true);
  };

  const handleAddTransaction = async (category: string, amount: number, note?: string) => {
    await addTransaction(selectedMonth, category, amount, note);
    setTransactions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), category, amount, ...(note?.trim() && { note: note.trim() }), createdAt: new Date().toISOString() },
    ]);
  };

  const handleDeleteTransaction = async (txId: string) => {
    await deleteTransaction(selectedMonth, txId);
    setTransactions((prev) => prev.filter((tx) => tx.id !== txId));
  };

  const handleAddCategory = async (groupName: string, category: string): Promise<void> => {
    setGroups((prev) =>
      prev.map((g) =>
        g.name === groupName ? { ...g, categories: [...g.categories, category] } : g
      )
    );
    try {
      await addCategory(groupName, category);
    } catch (err) {
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
    setGroups((prev) =>
      prev.map((g) =>
        g.name === groupName ? { ...g, categories: g.categories.filter((c) => c !== category) } : g
      )
    );
    try {
      await deleteCategory(groupName, category);
    } catch (err) {
      setGroups((prev) =>
        prev.map((g) =>
          g.name === groupName ? { ...g, categories: [...g.categories, category] } : g
        )
      );
      throw err;
    }
  };

  const allCategories = groups.flatMap((g) => g.categories);

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
          <button
            onClick={() => setActiveTab("transactions")}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === "transactions"
                ? "bg-brown-800 text-white"
                : "bg-cream-100 text-brown-600 hover:bg-cream-200"
            }`}
          >
            Transacciones
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
              transactions={transactions}
              selectedMonth={selectedMonth}
              onSave={(b) => onSaveBudget(selectedMonth, b)}
              onOpenTransaction={handleOpenTransaction}
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

        {activeTab === "transactions" && (
          <TransactionsTab
            transactions={transactions}
            groups={groups}
            onDelete={handleDeleteTransaction}
          />
        )}
      </div>

      <AddTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        initialCategory={activeTxCategory}
        allCategories={allCategories}
        onAdd={handleAddTransaction}
      />
    </main>
  );
}
