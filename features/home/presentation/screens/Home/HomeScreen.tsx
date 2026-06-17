import Link from "next/link";

const NAV_ITEMS = [
  { label: "Mi Wishlist", href: "/wishlist", enabled: true },
  { label: "Próximamente", href: null, enabled: false },
  { label: "Próximamente", href: null, enabled: false },
  { label: "Próximamente", href: null, enabled: false },
];

export function HomeScreen() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <h1 className="font-dancing text-5xl text-brown-800">Mi Wishlist</h1>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {NAV_ITEMS.map(({ label, href, enabled }) =>
          enabled && href ? (
            <Link
              key={label}
              href={href}
              className="flex items-center justify-center rounded-2xl bg-brown-800 px-4 py-8 text-cream-100 font-dancing text-xl shadow-md transition-colors hover:bg-brown-700 active:bg-brown-900"
            >
              {label}
            </Link>
          ) : (
            <div
              key={label}
              className="flex items-center justify-center rounded-2xl bg-cream-300 px-4 py-8 text-brown-500 font-dancing text-xl opacity-50 cursor-not-allowed select-none"
            >
              {label}
            </div>
          )
        )}
      </div>
    </main>
  );
}

export default HomeScreen;
