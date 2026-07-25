import Link from "next/link";
import { FEATURE_NAV_ITEMS } from "@/shared/navigation/features";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <div className="px-6 py-12 text-center">
        <h1 className="font-dancing text-brown-900 mb-2 text-5xl font-bold">Hola 👋</h1>
        <p className="text-brown-400 mb-12 text-sm">¿Qué querés ver hoy?</p>
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-cream-300 hover:border-brown-300 hover:shadow-card-hover flex flex-col items-center gap-3 rounded-2xl border bg-white px-8 py-10 shadow-sm transition-all"
            >
              <span className="text-4xl">{item.icon}</span>
              <span className="font-dancing text-brown-900 text-2xl font-bold">{item.label}</span>
              <span className="text-brown-400 text-xs">{item.subtitle}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
