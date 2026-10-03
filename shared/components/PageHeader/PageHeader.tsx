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
          className="text-brown-500 hover:text-brown-900 flex items-center gap-1.5 text-base transition-colors"
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
        <p className="bg-lilac-500/50 text-lilac-800 mb-3 inline-block rounded-full px-3 py-0.5 text-sm">
          {eyebrow}
        </p>
      )}
      <h1 className="font-dancing text-brown-900 underline-wavy mb-8 text-6xl">{title}</h1>
      {children}
    </header>
  );
}
