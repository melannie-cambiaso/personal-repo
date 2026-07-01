"use client";

import { useState } from "react";
import { computeForecast } from "@/features/savings/domain/computeForecast";
import { DEFAULT_ANNUAL_RATE } from "@/features/savings/domain/ForecastConfig";
import type { ForecastConfig } from "@/features/savings/domain/ForecastConfig";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { ModalShell, Input } from "@/shared/components";

interface ForecastTabProps {
  currentBalance: number;
  initialConfig: ForecastConfig | null;
  suggestedIncome: number;
  onSaveConfig: (config: ForecastConfig, months: number) => Promise<void>;
}

export function ForecastTab({
  currentBalance,
  initialConfig,
  suggestedIncome,
  onSaveConfig,
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
          <span className="text-brown-500 text-xs font-semibold tracking-wide uppercase">
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
          <span className="text-brown-500 text-xs font-semibold tracking-wide uppercase">
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
          <span className="text-brown-500 text-xs font-semibold tracking-wide uppercase">
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
          <span className="text-brown-500 text-xs font-semibold tracking-wide uppercase">
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-cream-300 border-b text-left">
              <th className="text-brown-500 pb-2 font-semibold">Mes</th>
              <th className="text-brown-500 pb-2 font-semibold">Ingreso</th>
              <th className="text-brown-500 pb-2 text-right font-semibold">Saldo proyectado</th>
            </tr>
          </thead>
          <tbody className="divide-cream-300 divide-y">
            {forecast.map(({ monthKey, month, projectedBalance }, i) => {
              const income = config.incomeOverrides[monthKey] ?? config.defaultIncome;
              return (
                <tr key={month}>
                  <td className="text-brown-700 py-3 capitalize">{month}</td>
                  <td className="py-3">
                    <input
                      type="number"
                      min={0}
                      value={income}
                      onChange={(e) => handleIncomeChange(i, e.target.value)}
                      className="border-cream-400 text-brown-900 focus:border-brown-600 w-28 rounded border bg-white px-2 py-1 text-sm transition-colors outline-none"
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
          className="bg-brown-800 hover:bg-brown-700 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          Guardar configuración
        </button>
      </div>
    </div>
  );
}
