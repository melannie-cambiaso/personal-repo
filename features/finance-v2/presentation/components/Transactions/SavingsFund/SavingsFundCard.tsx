import { formatCLP } from "@/shared/utils/formatCurrency";
import type { SavingsFundView } from "./savingsFundView";

interface Props {
  view: SavingsFundView;
  onEdit: () => void;
}

function formatBalance(amount: number): string {
  return amount < 0 ? `-${formatCLP(Math.abs(amount))}` : formatCLP(amount);
}

function Figure({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-600">{label}</span>
      <span className={`font-figure text-sm font-bold ${className ?? "text-ink-800"}`}>
        {value}
      </span>
    </div>
  );
}

// `endOfMonth = carriedIn + deposited − withdrawn − spent`. The inputs are shown above the
// result so the card reconciles by eye, like `EnvelopeCard`. Money leaving the fund is split
// in two (back to the account vs. spent) so the user can tell them apart. A negative balance
// is a WARNING only: nothing is blocked, the user just took out more than the fund held.
export function SavingsFundCard({ view, onEdit }: Props) {
  if (view.carriedIn === null) return null;

  const { config, carriedIn, flows } = view;
  const endOfMonth = carriedIn + flows.deposited - flows.withdrawn - flows.spent;
  const isNegative = endOfMonth < 0;

  return (
    <div className="border-surface-300 bg-surface-100 flex flex-col gap-4 rounded-3xl border-2 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="bg-info-500 flex size-10 shrink-0 items-center justify-center rounded-full text-xl"
          >
            🐷
          </span>
          <span className="text-ink-900 truncate text-2xl">{config.name}</span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="bg-surface-300 text-info-800 hover:bg-info-500 shrink-0 cursor-pointer rounded-full px-3 py-0.5 text-sm transition-colors"
        >
          Editar ahorros
        </button>
      </div>
      <div className="bg-surface-50/70 border-surface-300 flex flex-col gap-1 rounded-2xl border-2 px-4 py-3">
        <Figure label="Saldo inicial del mes" value={formatCLP(carriedIn)} />
        <Figure label="Depositado" value={formatCLP(flows.deposited)} />
        <Figure label="Retirado a la cuenta" value={formatCLP(flows.withdrawn)} />
        <Figure label="Gastado" value={formatCLP(flows.spent)} />
      </div>
      <div className="flex flex-col gap-1 px-1">
        <Figure
          label="Saldo"
          value={formatBalance(endOfMonth)}
          className={isNegative ? "text-red-700" : undefined}
        />
        {isNegative && (
          <p role="alert" className="text-xs text-red-700">
            Los ahorros quedaron en negativo: sacaste más de lo que había.
          </p>
        )}
      </div>
    </div>
  );
}
