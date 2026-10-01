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
      <span className="text-brown-500 text-sm">{label}</span>
      <span className={`text-sm font-bold ${className ?? "text-brown-800"}`}>{value}</span>
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
    <div className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-brown-800 text-sm font-semibold">{config.name}</span>
        <button
          type="button"
          onClick={onEdit}
          className="text-2xs text-brown-400 hover:text-brown-800 cursor-pointer font-semibold transition-colors"
        >
          Editar cuenta
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <Figure label="Saldo inicial del mes" value={formatCLP(carriedIn)} />
        <Figure label="Transferido" value={formatCLP(flows.transferred)} />
        <Figure label="Pagado" value={formatCLP(flows.paid)} />
      </div>
      <div className="border-cream-300 flex flex-col gap-1 border-t pt-3">
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
