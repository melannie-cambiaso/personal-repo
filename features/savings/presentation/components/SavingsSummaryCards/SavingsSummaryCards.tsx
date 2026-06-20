"use client";

interface Props {
  balance: number;
  totalToReplenish: number;
}

export function SavingsSummaryCards({ balance, totalToReplenish }: Props) {
  const balanceColor =
    balance > 0 ? "text-green-700" : balance < 0 ? "text-red-600" : "text-brown-600";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-cream-300 bg-white px-6 py-5 shadow-sm">
        <p className="mb-1 text-2xs font-semibold uppercase tracking-store text-brown-400">Balance</p>
        <p className={`text-2xl font-bold ${balanceColor}`}>
          ${balance.toLocaleString("es-AR")}
        </p>
      </div>
      <div className="rounded-2xl border border-cream-300 bg-white px-6 py-5 shadow-sm">
        <p className="mb-1 text-2xs font-semibold uppercase tracking-store text-brown-400">A reponer</p>
        <p className="text-2xl font-bold text-amber-600">
          ${totalToReplenish.toLocaleString("es-AR")}
        </p>
      </div>
    </div>
  );
}
