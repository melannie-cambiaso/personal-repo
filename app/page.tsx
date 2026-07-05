import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <div className="px-6 py-12 text-center">
        <h1 className="font-dancing text-brown-900 mb-2 text-5xl font-bold">Hola 👋</h1>
        <p className="text-brown-400 mb-12 text-sm">¿Qué querés ver hoy?</p>
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/wishlist"
            className="border-cream-300 hover:border-brown-300 hover:shadow-card-hover flex flex-col items-center gap-3 rounded-2xl border bg-white px-8 py-10 shadow-sm transition-all"
          >
            <span className="text-4xl">🛍️</span>
            <span className="font-dancing text-brown-900 text-2xl font-bold">Wishlist</span>
            <span className="text-brown-400 text-xs">Tus cosas deseadas</span>
          </Link>
          <Link
            href="/todo"
            className="border-cream-300 hover:border-brown-300 hover:shadow-card-hover flex flex-col items-center gap-3 rounded-2xl border bg-white px-8 py-10 shadow-sm transition-all"
          >
            <span className="text-4xl">✅</span>
            <span className="font-dancing text-brown-900 text-2xl font-bold">To-Do</span>
            <span className="text-brown-400 text-xs">Tus tareas pendientes</span>
          </Link>
          <Link
            href="/home-improvements"
            className="border-cream-300 hover:border-brown-300 hover:shadow-card-hover flex flex-col items-center gap-3 rounded-2xl border bg-white px-8 py-10 shadow-sm transition-all"
          >
            <span className="text-4xl">🏠</span>
            <span className="font-dancing text-brown-900 text-2xl font-bold">Casa</span>
            <span className="text-brown-400 text-xs">Mejoras del hogar</span>
          </Link>
          <Link
            href="/savings"
            className="border-cream-300 hover:border-brown-300 hover:shadow-card-hover flex flex-col items-center gap-3 rounded-2xl border bg-white px-8 py-10 shadow-sm transition-all"
          >
            <span className="text-4xl">💰</span>
            <span className="font-dancing text-brown-900 text-2xl font-bold">Ahorros</span>
            <span className="text-brown-400 text-xs">Tu registro financiero</span>
          </Link>
          <Link
            href="/finance"
            className="border-cream-300 hover:border-brown-300 hover:shadow-card-hover flex flex-col items-center gap-3 rounded-2xl border bg-white px-8 py-10 shadow-sm transition-all"
          >
            <span className="text-4xl">💸</span>
            <span className="font-dancing text-brown-900 text-2xl font-bold">Finanzas</span>
            <span className="text-brown-400 text-xs">Presupuesto mensual</span>
          </Link>
          <Link
            href="/shopping-list"
            className="border-cream-300 hover:border-brown-300 hover:shadow-card-hover flex flex-col items-center gap-3 rounded-2xl border bg-white px-8 py-10 shadow-sm transition-all"
          >
            <span className="text-4xl">🛒</span>
            <span className="font-dancing text-brown-900 text-2xl font-bold">Compras</span>
            <span className="text-brown-400 text-xs">Listas por categoría</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
