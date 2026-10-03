import Image from "next/image";
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

// Full literal class strings so Tailwind can see them: tile fill/border and icon circle.
const SHORTCUT_TONES: Record<string, { tile: string; icon: string }> = {
  "/home-improvements": {
    tile: "border-mist-300 bg-mist-100 hover:border-mist-500",
    icon: "bg-mist-500",
  },
  "/savings": {
    tile: "border-butter-300 bg-butter-100 hover:border-butter-500",
    icon: "bg-butter-500",
  },
};
const DEFAULT_TONE = {
  tile: "border-cream-300 bg-cream-50 hover:border-cream-500",
  icon: "bg-cream-300",
};

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
      {/* Wide screens put the summary cards side by side so the whole home fits
          without scrolling; phones keep the single stacked column. */}
      <div className="w-full max-w-2xl px-6 py-12 text-center lg:max-w-5xl lg:py-8">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:mb-6">
          {/* The greeting is the page heading, so the image's text lives in its alt.
              `loading="eager"` because it is above the fold (Next 16 deprecates
              `priority`; its docs prefer `loading="eager"` over `preload`). */}
          <h1>
            <Image
              src="/home-greeting.png"
              alt="¡Hola! Un perrito saluda con la pata: solo quería decirte que todo va a estar bien"
              width={1254}
              height={1254}
              sizes="(min-width: 1024px) 13rem, 11rem"
              loading="eager"
              className="border-lilac-300 w-44 rounded-3xl border-2 lg:w-52"
            />
          </h1>
          <p className="border-butter-300 bg-butter-100 text-butter-800 -rotate-2 rounded-lg border-2 px-3 py-1 shadow-sm">
            ¿Qué querés ver hoy?
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FinanceSummaryCard
            month={summary.month}
            balance={summary.balance}
            pending={summary.pending}
          />
          <WishlistSummaryCard
            pendingCount={wishlist.pendingCount}
            total={wishlist.total}
            topHigh={wishlist.topHigh}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {SHORTCUTS.map((item) => {
            const tone = SHORTCUT_TONES[item.href] ?? DEFAULT_TONE;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${tone.tile} flex flex-col items-center gap-1 rounded-3xl border-2 px-2 py-4 transition-colors`}
              >
                <span
                  aria-hidden
                  className={`${tone.icon} flex size-10 items-center justify-center rounded-full text-xl`}
                >
                  {item.icon}
                </span>
                <span className="font-dancing text-brown-900 text-xl">{item.label}</span>
                <span className="text-brown-500 hidden text-sm sm:block">{item.subtitle}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
