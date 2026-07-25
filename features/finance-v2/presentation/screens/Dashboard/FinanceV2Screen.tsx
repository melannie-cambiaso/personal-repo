"use client";

import { useState } from "react";
import type { BucketKey, FinanceV2Config } from "@/features/finance-v2/domain";
import { useFinanceV2Dashboard } from "../../hooks/useFinanceV2Dashboard";
import { SplitSummary, BUCKET_LABELS } from "../../components/Split/SplitSummary";
import { Field, Input, PageHeader } from "@/shared/components";

const BUCKET_ORDER: BucketKey[] = ["fixed", "variable", "savings"];

const PERCENTAGE_FIELD: Record<BucketKey, keyof FinanceV2Config> = {
  fixed: "fixedPct",
  variable: "variablePct",
  savings: "savingsPct",
};

interface Props {
  initialConfig: FinanceV2Config;
  onSave: (config: FinanceV2Config) => Promise<void> | void;
}

export function FinanceV2Screen({ initialConfig, onSave }: Props) {
  const { config, split, handleIncomeBlur, handlePercentageBlur } = useFinanceV2Dashboard({
    initialConfig,
    onSave,
  });

  // Uncontrolled inputs (`defaultValue`) only reflect fresh state on remount, so a
  // counter bumped on every blur forces one — otherwise a clamp that resolves to the
  // SAME numeric value as before (e.g. -500 -> 0 when income was already 0) would
  // leave the stale, un-clamped text visible in the DOM. Same pattern as `BudgetTab`'s
  // `inputKey`.
  const [version, setVersion] = useState(0);

  const onIncomeBlur = (raw: string) => {
    handleIncomeBlur(raw);
    setVersion((v) => v + 1);
  };

  const onPercentageBlur = (key: BucketKey, raw: string) => {
    handlePercentageBlur(key, raw);
    setVersion((v) => v + 1);
  };

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Distribuí tu ingreso" title="Finanzas v2" />

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
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
              onBlur={(e) => onIncomeBlur(e.target.value)}
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
                    onBlur={(e) => onPercentageBlur(key, e.target.value)}
                  />
                </Field>
              );
            })}
          </div>
        </div>

        <SplitSummary split={split} />
      </div>
    </main>
  );
}
