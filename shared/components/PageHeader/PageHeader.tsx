import Link from "next/link";

interface Props {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, children }: Props) {
  return (
    <header
      className="relative w-full px-6 py-10 text-center"
      style={{ background: "var(--gradient-header)" }}
    >
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="text-cream-100/70 hover:text-cream-100 flex items-center gap-1.5 text-sm font-medium transition-colors"
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
        <p className="text-2xs tracking-eyebrow text-brown-200 mb-3 font-semibold uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="font-dancing text-cream-100 mb-8 text-6xl font-bold">{title}</h1>
      {children}
    </header>
  );
}
