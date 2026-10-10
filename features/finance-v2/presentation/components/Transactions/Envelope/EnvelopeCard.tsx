import { formatCLP } from "@/shared/utils/formatCurrency";
import type { EnvelopeView } from "./envelopeView";

interface Props {
  view: EnvelopeView;
  onEdit: () => void;
}

function formatBalance(amount: number): string {
  return amount < 0 ? `-${formatCLP(Math.abs(amount))}` : formatCLP(amount);
}

function Figure({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-brown-600">{label}</span>
      <span className={`font-figure text-sm font-bold ${className ?? "text-brown-800"}`}>
        {value}
      </span>
    </div>
  );
}

// `endOfMonth = carriedIn + transferred − paid` (design D2). The three inputs are shown
// above the result so the card reconciles by eye, like `MovementSummary`. A negative
// balance is a WARNING only (spec): nothing is blocked, the user just overspent the
// envelope and should move more money.
export function EnvelopeCard({ view, onEdit }: Props) {
  if (view.carriedIn === null) return null;

  const { config, carriedIn, flows } = view;
  const endOfMonth = carriedIn + flows.transferred - flows.paid;
  const isNegative = endOfMonth < 0;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border-2 border-mist-300 bg-mist-100 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mist-500 text-xl"
          >
            ✉️
          </span>
          <span className="text-brown-900 truncate text-2xl font-semibold tracking-tight">
            {config.name}
          </span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 cursor-pointer rounded-full bg-mist-300 px-3 py-0.5 text-sm text-mist-800 transition-colors hover:bg-mist-500"
        >
          Editar cuenta
        </button>
      </div>
      <div className="bg-cream-50/70 flex flex-col gap-1 rounded-2xl border-2 border-mist-300 px-4 py-3">
        <Figure label="Saldo inicial del mes" value={formatCLP(carriedIn)} />
        <Figure label="Transferido" value={formatCLP(flows.transferred)} />
        <Figure label="Pagado" value={formatCLP(flows.paid)} />
      </div>
      <div className="flex flex-col gap-1 px-1">
        <Figure
          label="Saldo"
          value={formatBalance(endOfMonth)}
          className={isNegative ? "text-red-700" : undefined}
        />
        {isNegative && (
          <p role="alert" className="text-xs text-red-700">
            La cuenta quedó en negativo: pagaste más de lo que transferiste.
          </p>
        )}
      </div>
    </div>
  );
}
