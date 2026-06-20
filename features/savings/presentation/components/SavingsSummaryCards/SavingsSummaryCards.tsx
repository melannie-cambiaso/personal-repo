"use client";

interface Props {
  balance: number;
  totalToReplenish: number;
  totalDepositos: number;
  totalGastos: number;
}

export function SavingsSummaryCards({ balance, totalToReplenish, totalDepositos, totalGastos }: Props) {
  const balanceColor =
    balance > 0 ? "text-green-700" : balance < 0 ? "text-red-600" : "text-brown-600";

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="rounded-2xl border border-green-200 bg-white px-5 py-4 shadow-sm">
        <p className="mb-1 text-2xs font-semibold uppercase tracking-store text-brown-400">Ingresos</p>
        <p className="text-xl font-bold text-green-700">${totalDepositos.toLocaleString("es-AR")}</p>
      </div>
      <div className="rounded-2xl border border-red-200 bg-white px-5 py-4 shadow-sm">
        <p className="mb-1 text-2xs font-semibold uppercase tracking-store text-brown-400">Gastos</p>
        <p className="text-xl font-bold text-red-700">${totalGastos.toLocaleString("es-AR")}</p>
      </div>
      <div className="rounded-2xl border border-cream-300 bg-white px-5 py-4 shadow-sm">
        <p className="mb-1 text-2xs font-semibold uppercase tracking-store text-brown-400">Balance</p>
        <p className={`text-xl font-bold ${balanceColor}`}>${balance.toLocaleString("es-AR")}</p>
      </div>
      <div className="rounded-2xl border border-cream-300 bg-white px-5 py-4 shadow-sm">
        <p className="mb-1 text-2xs font-semibold uppercase tracking-store text-brown-400">A reponer</p>
        <p className="text-xl font-bold text-amber-600">${totalToReplenish.toLocaleString("es-AR")}</p>
      </div>
    </div>
  );
}
