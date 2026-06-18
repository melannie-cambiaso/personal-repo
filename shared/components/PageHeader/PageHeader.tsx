import Link from "next/link"

interface Props {
  eyebrow?: string
  title: string
  children?: React.ReactNode
}

export function PageHeader({ eyebrow, title, children }: Props) {
  return (
    <header
      className="relative w-full px-6 py-10 text-center"
      style={{ background: "var(--gradient-header)" }}
    >
      <div className="absolute left-6 top-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-cream-100/70 transition-colors hover:text-cream-100"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Inicio
        </Link>
      </div>

      {eyebrow && (
        <p className="text-2xs mb-3 font-semibold uppercase tracking-eyebrow text-brown-200">
          {eyebrow}
        </p>
      )}
      <h1 className="font-dancing mb-8 text-6xl font-bold text-cream-100">{title}</h1>
      {children}
    </header>
  )
}
