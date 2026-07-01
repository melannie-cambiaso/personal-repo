"use client";

import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  balance: number;
  totalToReplenish: number;
  totalDepositos: number;
  totalGastos: number;
}

export function SavingsSummaryCards({
  balance,
  totalToReplenish,
  totalDepositos,
  totalGastos,
}: Props) {
  const balanceColor =
    balance > 0 ? "text-green-700" : balance < 0 ? "text-red-600" : "text-brown-600";

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="rounded-2xl border border-green-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-2xs tracking-store text-brown-400 mb-1 font-semibold uppercase">
          Ingresos
        </p>
        <p className="text-xl font-bold text-green-700">{formatCLP(totalDepositos)}</p>
      </div>
      <div className="rounded-2xl border border-red-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-2xs tracking-store text-brown-400 mb-1 font-semibold uppercase">
          Gastos
        </p>
        <p className="text-xl font-bold text-red-700">{formatCLP(totalGastos)}</p>
      </div>
      <div className="border-cream-300 rounded-2xl border bg-white px-5 py-4 shadow-sm">
        <p className="text-2xs tracking-store text-brown-400 mb-1 font-semibold uppercase">
          Balance
        </p>
        <p className={`text-xl font-bold ${balanceColor}`}>{formatCLP(balance)}</p>
      </div>
      <div className="border-cream-300 rounded-2xl border bg-white px-5 py-4 shadow-sm">
        <p className="text-2xs tracking-store text-brown-400 mb-1 font-semibold uppercase">
          A reponer
        </p>
        <p className="text-xl font-bold text-amber-600">{formatCLP(totalToReplenish)}</p>
      </div>
    </div>
  );
}
