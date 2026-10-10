import Link from "next/link";
import type { WishlistSummary } from "@/features/wishlist/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

// The home page's glance at the wishlist: the same pending count / approximate total
// as the `/wishlist` header, plus the top high-priority items, with a link into the
// full list. Styled as a sibling of `FinanceSummaryCard`.
export function WishlistSummaryCard({ pendingCount, total, topHigh }: WishlistSummary) {
  return (
    <div className="border-blush-300 bg-blush-100 flex flex-col gap-4 rounded-3xl border-2 p-5 text-left">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="bg-blush-500 flex size-10 shrink-0 items-center justify-center rounded-full text-xl"
        >
          🛍️
        </span>
        <h2 className="text-brown-900 text-2xl">
          Wishlist
        </h2>
      </div>
      <div className="border-blush-300 bg-cream-50/70 flex flex-col gap-2 rounded-2xl border-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-brown-600">Pendientes</span>
          <span className="font-figure text-brown-900 text-sm font-semibold">{pendingCount}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-brown-600">Total aprox.</span>
          <span className="font-figure text-brown-900 text-sm font-semibold">
            {formatCLP(total)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="bg-blush-300 text-blush-800 self-start rounded-full px-3 py-0.5 text-sm">
          Prioridad alta
        </span>
        {topHigh.length === 0 ? (
          <span className="text-brown-500">Nada con prioridad alta</span>
        ) : (
          <ul className="flex flex-col gap-1">
            {topHigh.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <span aria-hidden className="bg-blush-500 size-2 shrink-0 rounded-full" />
                <span className="text-brown-800 min-w-0 flex-1 truncate">{item.title}</span>
                {item.price !== null ? (
                  <span className="font-figure text-brown-900 shrink-0 text-sm font-semibold">
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
      <div className="mt-auto flex items-center justify-between gap-2">
        <Link
          href="/wishlist"
          className="bg-blush-300 text-blush-800 hover:bg-blush-500 rounded-full px-3 py-0.5 transition-colors"
        >
          Ver más →
        </Link>
      </div>
    </div>
  );
}
