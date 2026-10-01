import { formatCLP } from "@/shared/utils/formatCurrency";
import type { EnvelopeView } from "./envelopeView";

interface Props {
  view: EnvelopeView;
}

// Shown only when the viewed month is live (carried-in known, so ≥ opening month and
// not loading) and has no transfer yet. The user relies on this because the transfer
// happens once a month, on payday, and is easy to forget (proposal).
export function EnvelopeReminder({ view }: Props) {
  if (view.carriedIn === null || view.flows.transferred > 0) return null;

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900"
    >
      {view.suggestedTransfer === null ? (
        <span>La categoría vinculada ya no existe. Revisá la configuración.</span>
      ) : (
        <span>
          Todavía no transferiste a {view.config.name} este mes. Sugerido:{" "}
          <span className="font-bold">{formatCLP(view.suggestedTransfer)}</span>
        </span>
      )}
    </div>
  );
}
