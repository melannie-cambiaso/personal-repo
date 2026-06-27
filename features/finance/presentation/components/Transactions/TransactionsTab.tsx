"use client";

import { useState } from "react";
import type { FinanceTransaction } from "@/features/finance/domain";
import { TransactionCard } from "./TransactionCard";
import { groupTransactionsByCategory } from "@/features/finance/domain/groupTransactionsByCategory";
import { groupTransactionsByDay } from "@/features/finance/domain/groupTransactionsByDay";

type Group = { name: string; categories: string[] };

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

interface Props {
  transactions: FinanceTransaction[];
  groups: Group[];
  onDelete: (id: string) => void;
}

const pillBase =
  "cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors";
const pillActive = "bg-brown-800 text-white";
const pillInactive = "bg-cream-100 text-brown-600 hover:bg-cream-200";

export function TransactionsTab({ transactions, groups, onDelete }: Props) {
  const [groupBy, setGroupBy] = useState<"category" | "day">("category");

  if (transactions.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-brown-400">
        No hay transacciones este mes
      </p>
    );
  }

  // Build category → groupName map once for day mode
  const categoryToGroupName = new Map<string, string>();
  for (const g of groups) {
    for (const cat of g.categories) {
      categoryToGroupName.set(cat, g.name);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toggle */}
      <div className="flex gap-2">
        <button
          className={`${pillBase} ${groupBy === "category" ? pillActive : pillInactive}`}
          onClick={() => setGroupBy("category")}
        >
          Por categoría
        </button>
        <button
          className={`${pillBase} ${groupBy === "day" ? pillActive : pillInactive}`}
          onClick={() => setGroupBy("day")}
        >
          Por día
        </button>
      </div>

      {/* Category mode */}
      {groupBy === "category" &&
        groupTransactionsByCategory(transactions, groups).map((group) => (
          <section key={group.category}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-brown-800">{group.category}</span>
              <span className="text-sm text-brown-500">{fmt(group.total)}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {group.transactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  groupName={group.groupName}
                  showCategory={false}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </section>
        ))}

      {/* Day mode */}
      {groupBy === "day" &&
        groupTransactionsByDay(transactions).map((dayGroup) => (
          <section key={dayGroup.date}>
            <div className="mb-2">
              <span className="text-sm font-semibold text-brown-800">
                {new Date(dayGroup.date + "T00:00:00").toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {dayGroup.transactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  groupName={categoryToGroupName.get(tx.category) ?? "Otro"}
                  showCategory={true}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
