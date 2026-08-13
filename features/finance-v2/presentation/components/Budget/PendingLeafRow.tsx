"use client";

import { useState } from "react";
import type { PendingRow } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { Input } from "@/shared/components";
import type { BudgetMode } from "./budgetMode";

interface Props {
  mode: BudgetMode;
  row: PendingRow;
  onOverrideBlur: (leafId: string, raw: string) => void;
}

// View: `formatCLP(row.amount)` (the already-override-aware displayed value). Edit:
// uncontrolled amount input pre-filled with `row.amount`, remounted via a per-row version
// counter on blur — same idiom as `BudgetCategoryCard`'s `AmountField`.
export function PendingLeafRow({ mode, row, onOverrideBlur }: Props) {
  const [version, setVersion] = useState(0);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onOverrideBlur(row.id, e.target.value);
    setVersion((v) => v + 1);
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-brown-700 min-w-0 truncate text-sm">{row.name}</span>
      {mode === "view" ? (
        <span className="text-brown-800 text-sm font-bold">{formatCLP(row.amount)}</span>
      ) : (
        <div className="flex shrink-0 items-center">
          <Input
            type="number"
            min="0"
            aria-label={`Pendiente de ${row.name}`}
            defaultValue={row.amount || ""}
            key={`pending-${row.id}-${version}`}
            placeholder="0"
            autoComplete="off"
            className="w-24 text-right"
            onBlur={handleBlur}
          />
        </div>
      )}
    </div>
  );
}
