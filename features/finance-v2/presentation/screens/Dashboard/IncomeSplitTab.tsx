"use client";

import { useState } from "react";
import type { BucketKey, FinanceV2Config, SplitResult } from "@/features/finance-v2/domain";
import { SplitSummary } from "../../components/Split/SplitSummary";
import { BUCKET_LABELS, BUCKET_ORDER } from "../../components/bucketLabels";
import { Field, Input } from "@/shared/components";

const PERCENTAGE_FIELD: Record<BucketKey, keyof FinanceV2Config> = {
  fixed: "fixedPct",
  variable: "variablePct",
  savings: "savingsPct",
};

interface Props {
  config: FinanceV2Config;
  split: SplitResult;
  onIncomeBlur: (raw: string) => void;
  onPercentageBlur: (key: BucketKey, raw: string) => void;
}

export function IncomeSplitTab({ config, split, onIncomeBlur, onPercentageBlur }: Props) {
  // Uncontrolled inputs (`defaultValue`) only reflect fresh state on remount, so a
  // counter bumped on every blur forces one — otherwise a clamp that resolves to the
  // SAME numeric value as before (e.g. -500 -> 0 when income was already 0) would
  // leave the stale, un-clamped text visible in the DOM. Same pattern as `BudgetTab`'s
  // `inputKey`.
  const [version, setVersion] = useState(0);

  const handleIncomeBlur = (raw: string) => {
    onIncomeBlur(raw);
    setVersion((v) => v + 1);
  };

  const handlePercentageBlur = (key: BucketKey, raw: string) => {
    onPercentageBlur(key, raw);
    setVersion((v) => v + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-cream-300 flex flex-col gap-4 rounded-xl border bg-white p-4">
        <Field label="Ingreso mensual">
          <Input
            type="number"
            min="0"
            aria-label="Ingreso mensual"
            key={`income-${version}`}
            defaultValue={config.income || ""}
            placeholder="0"
            autoComplete="off"
            onBlur={(e) => handleIncomeBlur(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          {BUCKET_ORDER.map((key) => {
            const field = PERCENTAGE_FIELD[key];
            return (
              <Field key={key} label={BUCKET_LABELS[key]}>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  aria-label={BUCKET_LABELS[key]}
                  key={`pct-${key}-${version}`}
                  defaultValue={config[field]}
                  placeholder="0"
                  autoComplete="off"
                  onBlur={(e) => handlePercentageBlur(key, e.target.value)}
                />
              </Field>
            );
          })}
        </div>
      </div>

      <SplitSummary split={split} />
    </div>
  );
}
