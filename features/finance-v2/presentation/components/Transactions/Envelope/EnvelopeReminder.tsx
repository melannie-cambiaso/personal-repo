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
      className="border-butter-300 bg-butter-100 text-butter-800 flex -rotate-1 items-start gap-2 rounded-md border-2 px-4 py-3"
    >
      <span aria-hidden className="shrink-0">
        📌
      </span>
      {view.suggestedTransfer === null ? (
        <span>La categoría vinculada ya no existe. Revisá la configuración.</span>
      ) : (
        <span>
          Todavía no transferiste a {view.config.name} este mes. Sugerido:{" "}
          <span className="font-figure text-sm font-bold">{formatCLP(view.suggestedTransfer)}</span>
        </span>
      )}
    </div>
  );
}
