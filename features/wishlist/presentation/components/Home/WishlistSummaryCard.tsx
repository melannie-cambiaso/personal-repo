import Link from "next/link";
import type { WishlistSummary } from "@/features/wishlist/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

// The home page's glance at the wishlist: the same pending count / approximate total
// as the `/wishlist` header, plus the top high-priority items, with a link into the
// full list. Styled as a sibling of `FinanceSummaryCard`.
export function WishlistSummaryCard({ pendingCount, total, topHigh }: WishlistSummary) {
  return (
    <div className="border-cream-300 flex flex-col gap-3 rounded-2xl border bg-white p-5 text-left shadow-sm">
      <span className="font-dancing text-brown-900 text-2xl font-bold">Wishlist</span>
      <div className="flex items-center justify-between gap-2">
        <span className="text-brown-500 text-sm">Pendientes</span>
        <span className="text-brown-800 text-sm font-bold">{pendingCount}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-brown-500 text-sm">Total aprox.</span>
        <span className="text-brown-800 text-sm font-bold">{formatCLP(total)}</span>
      </div>
      <div className="border-cream-300 flex flex-col gap-2 border-t pt-3">
        <span className="text-brown-400 text-xs">Prioridad alta</span>
        {topHigh.length === 0 ? (
          <span className="text-brown-400 text-sm">Nada con prioridad alta</span>
        ) : (
          topHigh.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <span className="text-brown-800 truncate text-sm">{item.title}</span>
              {item.price !== null ? (
                <span className="text-brown-800 shrink-0 text-sm font-bold">
                  {formatCLP(item.price)}
                </span>
              ) : (
                <span className="shrink-0 text-sm font-bold text-red-600">Falta precio</span>
              )}
            </div>
          ))
        )}
      </div>
      <div className="border-cream-300 mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <Link href="/wishlist" className="text-brown-500 hover:text-brown-800 text-sm">
          Ver más →
        </Link>
      </div>
    </div>
  );
}
