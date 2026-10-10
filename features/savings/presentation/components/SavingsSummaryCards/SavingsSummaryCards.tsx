"use client";

import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  balance: number;
  totalToReplenish: number;
  totalDepositos: number;
  totalGastos: number;
  initialAmount?: number;
}

// Label and value are siblings so each value keeps its own semantic color class.
function Stat({
  label,
  value,
  border,
  tone,
}: {
  label: string;
  value: string;
  border: string;
  tone: string;
}) {
  return (
    <div
      className={`${border} bg-cream-50/70 flex min-w-0 flex-col rounded-2xl border-2 px-3 py-2`}
    >
      <p className="text-brown-500 text-sm">{label}</p>
      <p className={`font-figure text-base font-bold sm:text-lg ${tone}`}>{value}</p>
    </div>
  );
}

export function SavingsSummaryCards({
  balance,
  totalToReplenish,
  totalDepositos,
  totalGastos,
  initialAmount,
}: Props) {
  const balanceColor =
    balance > 0 ? "text-green-700" : balance < 0 ? "text-red-600" : "text-brown-600";

  return (
    <div className="border-butter-300 bg-butter-100 flex flex-col gap-3 rounded-3xl border-2 p-4">
      {typeof initialAmount === "number" && initialAmount > 0 && (
        <div className="border-butter-300 bg-cream-50/70 flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-2">
          <p className="text-brown-600">Monto inicial</p>
          <p className="font-figure text-brown-900 text-lg font-bold">{formatCLP(initialAmount)}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Ingresos"
          value={formatCLP(totalDepositos)}
          border="border-sage-300"
          tone="text-green-700"
        />
        <Stat
          label="Gastos"
          value={formatCLP(totalGastos)}
          border="border-blush-300"
          tone="text-red-700"
        />
        <Stat
          label="Balance"
          value={formatCLP(balance)}
          border="border-butter-300"
          tone={balanceColor}
        />
        <Stat
          label="A reponer"
          value={formatCLP(totalToReplenish)}
          border="border-blush-300"
          tone="text-blush-800"
        />
      </div>
    </div>
  );
}
