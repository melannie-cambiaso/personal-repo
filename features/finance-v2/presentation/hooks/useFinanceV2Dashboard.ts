"use client";

import { useMemo, useState } from "react";
import type { BucketKey, FinanceV2Config, SplitResult } from "@/features/finance-v2/domain";
import { clampIncome, clampPercentage, computeSplit } from "@/features/finance-v2/domain";

interface Params {
  initialConfig: FinanceV2Config;
  onSave: (config: FinanceV2Config) => Promise<void> | void;
}

const PERCENTAGE_FIELD: Record<BucketKey, keyof FinanceV2Config> = {
  fixed: "fixedPct",
  variable: "variablePct",
  savings: "savingsPct",
};

export function useFinanceV2Dashboard({ initialConfig, onSave }: Params) {
  const [config, setConfig] = useState<FinanceV2Config>(initialConfig);

  const split: SplitResult = useMemo(() => computeSplit(config), [config]);

  // Mirrors `BudgetTab.handleBlur`: clamp on blur, persist only when the resulting
  // split is valid (design decision #6) — an invalid config never reaches KV.
  const applyChange = (next: FinanceV2Config) => {
    setConfig(next);
    if (computeSplit(next).status === "valid") {
      void onSave(next);
    }
  };

  const handleIncomeBlur = (raw: string) => {
    applyChange({ ...config, income: clampIncome(raw) });
  };

  const handlePercentageBlur = (key: BucketKey, raw: string) => {
    applyChange({ ...config, [PERCENTAGE_FIELD[key]]: clampPercentage(raw) });
  };

  return { config, split, handleIncomeBlur, handlePercentageBlur };
}
