"use client";

import { useState } from "react";
import { computeForecast } from "@/features/savings/domain/computeForecast";
import { computeGoalForecast } from "@/features/savings/domain/computeGoalForecast";
import { DEFAULT_ANNUAL_RATE } from "@/features/savings/domain/ForecastConfig";
import type { ForecastConfig } from "@/features/savings/domain/ForecastConfig";
import type { GoalWithProgress } from "@/features/savings/domain/SavingsGoal";
import { GoalForecastCard } from "./GoalForecastCard";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { ModalShell, Input } from "@/shared/components";

interface ForecastTabProps {
  currentBalance: number;
  initialConfig: ForecastConfig | null;
  suggestedIncome: number;
  onSaveConfig: (config: ForecastConfig, months: number) => Promise<void>;
  goals?: GoalWithProgress[];
}

export function ForecastTab({
  currentBalance,
  initialConfig,
  suggestedIncome,
  onSaveConfig,
  goals,
}: ForecastTabProps) {
  const [config, setConfig] = useState<ForecastConfig>(
    initialConfig ?? {
      defaultIncome: suggestedIncome,
      monthlyExpense: 0,
      annualRate: DEFAULT_ANNUAL_RATE,
      incomeOverrides: {},
    }
  );
  const [months, setMonths] = useState(12);

  const forecast = computeForecast(currentBalance, config, months);

  const goalResults =
    goals && goals.length > 0
      ? computeGoalForecast(goals, currentBalance, forecast)
      : [];

  const outsideWindowLabel = `más de ${months} meses`;

  function handleIncomeChange(i: number, raw: string) {
    const value = Math.max(0, Number(raw));
    const key = forecast[i].monthKey;
    setConfig((prev) => {
      const overrides = { ...prev.incomeOverrides };
      if (value === prev.defaultIncome) {
        delete overrides[key];
      } else {
        overrides[key] = value;
      }
      return { ...prev, incomeOverrides: overrides };
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brown-500">
            Ingreso mensual por defecto
          </span>
          <Input
            type="number"
            min={0}
            value={config.defaultIncome}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                defaultIncome: Math.max(0, Number(e.target.value)),
              }))
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brown-500">
            Gasto mensual estimado
          </span>
          <Input
            type="number"
            min={0}
            value={config.monthlyExpense}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                monthlyExpense: Math.max(0, Number(e.target.value)),
              }))
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brown-500">
            Meses a proyectar
          </span>
          <Input
            type="number"
            min={1}
            max={24}
            value={months}
            onChange={(e) =>
              setMonths(Math.max(1, Math.min(24, Math.round(Number(e.target.value)))))
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brown-500">
            Tasa de interés anual (%)
          </span>
          <Input
            type="number"
            min={0}
            step={0.1}
            value={config.annualRate}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                annualRate: Math.max(0, Number(e.target.value)),
              }))
            }
          />
        </label>
      </div>

      {goalResults.length > 0 && (
        <div className="space-y-2">
          {goalResults.map((result) => {
            const goal = goals!.find((g) => g.id === result.goalId)!;
            return (
              <GoalForecastCard
                key={result.goalId}
                name={result.name}
                monthsToCompletion={result.monthsToCompletion}
                estimatedCompletionMonth={result.estimatedCompletionMonth}
                outsideWindowLabel={outsideWindowLabel}
                currentAmount={goal.currentAmount}
                targetAmount={goal.targetAmount}
                progress={goal.progress}
              />
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300 text-left">
              <th className="pb-2 font-semibold text-brown-500">Mes</th>
              <th className="pb-2 font-semibold text-brown-500">Ingreso</th>
              <th className="pb-2 text-right font-semibold text-brown-500">Saldo proyectado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-300">
            {forecast.map(({ monthKey, month, projectedBalance }, i) => {
              const income = config.incomeOverrides[monthKey] ?? config.defaultIncome;
              return (
                <tr key={month}>
                  <td className="py-3 capitalize text-brown-700">{month}</td>
                  <td className="py-3">
                    <input
                      type="number"
                      min={0}
                      value={income}
                      onChange={(e) => handleIncomeChange(i, e.target.value)}
                      className="w-28 rounded border border-cream-400 bg-white px-2 py-1 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600"
                    />
                  </td>
                  <td
                    className={`py-3 text-right font-semibold ${
                      projectedBalance < 0 ? "text-red-500" : "text-brown-900"
                    }`}
                  >
                    {formatCLP(projectedBalance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onSaveConfig(config, months)}
          className="rounded-lg bg-brown-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brown-700"
        >
          Guardar configuración
        </button>
      </div>
    </div>
  );
}
