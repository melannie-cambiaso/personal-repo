import type { WishlistSummary } from "@/features/wishlist/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

// The home page's glance at the wishlist: the same pending count / approximate total
// as the `/wishlist` header, plus the top high-priority items, with a link into the
// full list. Styled as a sibling of `FinanceSummaryCard`.
export function WishlistSummaryCard({ pendingCount, total, topHigh }: WishlistSummary) {
  return (
    <div className="border-surface-300 bg-surface-50 flex flex-col gap-4 rounded-3xl border-2 p-5 text-left">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="bg-surface-200 flex size-10 shrink-0 items-center justify-center rounded-full text-xl"
        >
          🛍️
        </span>
        <h2 className="text-ink-900 text-2xl">Wishlist</h2>
      </div>
      <div className="border-surface-300 bg-surface-100 flex flex-col gap-2 rounded-2xl border-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-600">Pendientes</span>
          <span className="font-figure text-ink-900 text-sm font-semibold">{pendingCount}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-600">Total aprox.</span>
          <span className="font-figure text-ink-900 text-sm font-semibold">{formatCLP(total)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="bg-surface-200 text-ink-700 self-start rounded-full px-3 py-0.5 text-sm">
          Prioridad alta
        </span>
        {topHigh.length === 0 ? (
          <span className="text-ink-500">Nada con prioridad alta</span>
        ) : (
          <ul className="flex flex-col gap-1">
            {topHigh.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <span aria-hidden className="bg-ink-400 size-2 shrink-0 rounded-full" />
                <span className="text-ink-800 min-w-0 flex-1 truncate">{item.title}</span>
                {item.price !== null ? (
                  <span className="font-figure text-ink-900 shrink-0 text-sm font-semibold">
                    {formatCLP(item.price)}
                  </span>
                ) : (
                  <span className="shrink-0 text-red-600">Falta precio</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
