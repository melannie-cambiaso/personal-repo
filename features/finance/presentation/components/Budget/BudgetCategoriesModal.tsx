"use client";

import { type Group } from "@/features/finance/data/kvAdapter";
import { ModalShell, Button } from "@/shared/components";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  groups: Group[];
  excludedCategories: string[];
  onToggle: (category: string) => void;
}

/**
 * Month-scoped modal for managing which expense categories are visible in the
 * budget view. Only expense categories are listed — income/refund categories
 * are never excludable. Toggling persists immediately via `onToggle`; closing
 * the modal has no side effect of its own.
 */
export function BudgetCategoriesModal({
  isOpen,
  onClose,
  month,
  groups,
  excludedCategories,
  onToggle,
}: Props) {
  // Groups keep the order they were given in (same as BudgetTab's GroupSection); only
  // categories within each group are alphabetized, mirroring GroupSection's row order.
  const expenseGroups = groups.filter((g) => g.type === "expense");

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title={`Categorías del presupuesto — ${month}`}>
      <div className="flex flex-col gap-4">
        {expenseGroups.map((group) => (
          <section key={group.name} className="flex flex-col gap-2">
            <h3 className="text-brown-400 text-xs font-semibold tracking-wide uppercase">
              {group.name}
            </h3>
            <ul className="flex flex-col gap-2">
              {[...group.categories]
                .sort((a, b) => a.localeCompare(b, "es"))
                .map((cat) => {
                  const isExcluded = excludedCategories.includes(cat);
                  return (
                    <li key={cat} className="flex items-center justify-between gap-2">
                      <span className="text-brown-700 text-sm">{cat}</span>
                      <button
                        type="button"
                        onClick={() => onToggle(cat)}
                        aria-pressed={isExcluded}
                        className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors"
                      >
                        {isExcluded ? `Incluir ${cat}` : `Excluir ${cat}`}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}

        <div className="flex justify-end">
          <Button onPress={onClose} type="button" variant="secondary">
            Listo
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
