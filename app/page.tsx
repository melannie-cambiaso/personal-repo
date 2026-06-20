import Link from "next/link"

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <div className="px-6 py-12 text-center">
        <h1 className="font-dancing mb-2 text-5xl font-bold text-brown-900">Hola 👋</h1>
        <p className="mb-12 text-sm text-brown-400">¿Qué querés ver hoy?</p>
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/wishlist"
            className="flex flex-col items-center gap-3 rounded-2xl border border-cream-300 bg-white px-8 py-10 shadow-sm transition-all hover:border-brown-300 hover:shadow-card-hover"
          >
            <span className="text-4xl">🛍️</span>
            <span className="font-dancing text-2xl font-bold text-brown-900">Wishlist</span>
            <span className="text-xs text-brown-400">Tus cosas deseadas</span>
          </Link>
          <Link
            href="/todo"
            className="flex flex-col items-center gap-3 rounded-2xl border border-cream-300 bg-white px-8 py-10 shadow-sm transition-all hover:border-brown-300 hover:shadow-card-hover"
          >
            <span className="text-4xl">✅</span>
            <span className="font-dancing text-2xl font-bold text-brown-900">To-Do</span>
            <span className="text-xs text-brown-400">Tus tareas pendientes</span>
          </Link>
          <Link
            href="/home-improvements"
            className="flex flex-col items-center gap-3 rounded-2xl border border-cream-300 bg-white px-8 py-10 shadow-sm transition-all hover:border-brown-300 hover:shadow-card-hover"
          >
            <span className="text-4xl">🏠</span>
            <span className="font-dancing text-2xl font-bold text-brown-900">Casa</span>
            <span className="text-xs text-brown-400">Mejoras del hogar</span>
          </Link>
          <Link
            href="/savings"
            className="flex flex-col items-center gap-3 rounded-2xl border border-cream-300 bg-white px-8 py-10 shadow-sm transition-all hover:border-brown-300 hover:shadow-card-hover"
          >
            <span className="text-4xl">💰</span>
            <span className="font-dancing text-2xl font-bold text-brown-900">Ahorros</span>
            <span className="text-xs text-brown-400">Tu registro financiero</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
