"use client";

import { useState } from "react";
import { computeForecast } from "@/features/savings/domain/computeForecast";

interface ForecastTabProps {
  currentBalance: number;
}

export function ForecastTab({ currentBalance }: ForecastTabProps) {
  const [monthlyDeposit, setMonthlyDeposit] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [extraAmount, setExtraAmount] = useState(0);
  const [months, setMonths] = useState(12);

  const monthlyNet = monthlyDeposit - monthlyExpense;
  const forecast = computeForecast(currentBalance + extraAmount, monthlyNet, months);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brown-500">
            Depósito mensual estimado
          </span>
          <input
            type="number"
            min={0}
            value={monthlyDeposit}
            onChange={(e) => setMonthlyDeposit(Math.max(0, Number(e.target.value)))}
            className="rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brown-500">
            Gasto mensual estimado
          </span>
          <input
            type="number"
            min={0}
            value={monthlyExpense}
            onChange={(e) => setMonthlyExpense(Math.max(0, Number(e.target.value)))}
            className="rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brown-500">
            Monto extra (único)
          </span>
          <input
            type="number"
            min={0}
            value={extraAmount}
            onChange={(e) => setExtraAmount(Math.max(0, Number(e.target.value)))}
            className="rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brown-500">
            Meses a proyectar
          </span>
          <input
            type="number"
            min={1}
            max={24}
            value={months}
            onChange={(e) =>
              setMonths(Math.max(1, Math.min(24, Math.round(Number(e.target.value)))))
            }
            className="rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600"
          />
        </label>
      </div>

      <ul className="divide-y divide-cream-300">
        {forecast.map(({ month, projectedBalance }) => (
          <li key={month} className="flex items-center justify-between py-3">
            <span className="text-sm capitalize text-brown-700">{month}</span>
            <span
              className={`text-sm font-semibold ${
                projectedBalance < 0 ? "text-red-500" : "text-brown-900"
              }`}
            >
              ${projectedBalance.toLocaleString("es-AR")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
