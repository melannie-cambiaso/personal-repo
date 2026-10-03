import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loadHomeFinanceSummary } from "@/features/finance-v2/data";
import { FinanceSummaryCard } from "@/features/finance-v2/presentation/components/Home/FinanceSummaryCard";
import { loadHomeWishlistSummary } from "@/features/wishlist/data/homeWishlistSummary";
import { WishlistSummaryCard } from "@/features/wishlist/presentation/components/Home/WishlistSummaryCard";
import { FEATURE_NAV_ITEMS } from "@/shared/navigation/features";
import { currentMonth } from "@/shared/utils/monthUtils";

// Finance and the wishlist are covered by their summary cards, so they are left out
// of the shortcuts.
const CARD_HREFS = new Set(["/finance-v2", "/wishlist"]);
const SHORTCUTS = FEATURE_NAV_ITEMS.filter((item) => !item.disabled && !CARD_HREFS.has(item.href));

export default async function HomePage() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const [summary, wishlist] = await Promise.all([
    loadHomeFinanceSummary(currentMonth()),
    loadHomeWishlistSummary(),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-2xl px-6 py-12 text-center">
        <h1 className="font-dancing text-brown-900 mb-2 text-5xl font-bold">Hola 👋</h1>
        <p className="text-brown-400 mb-8 text-sm">¿Qué querés ver hoy?</p>
        <FinanceSummaryCard
          month={summary.month}
          balance={summary.balance}
          pending={summary.pending}
        />
        <div className="mt-4">
          <WishlistSummaryCard
            pendingCount={wishlist.pendingCount}
            total={wishlist.total}
            topHigh={wishlist.topHigh}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {SHORTCUTS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-cream-300 hover:border-brown-300 hover:shadow-card-hover flex flex-col items-center gap-1 rounded-2xl border bg-white px-2 py-4 shadow-sm transition-all"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-dancing text-brown-900 text-lg font-bold">{item.label}</span>
              <span className="text-brown-400 hidden text-xs sm:block">{item.subtitle}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
