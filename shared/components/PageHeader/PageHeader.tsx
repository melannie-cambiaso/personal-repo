interface Props {
  /** Short line shown under the title. */
  eyebrow?: string;
  title: string;
  /** Matches the page content's width so the header lines up with it. */
  wide?: boolean;
  /** Page-level controls or stats, placed to the right of the title. */
  children?: React.ReactNode;
}

// Compact bar: title on the left, controls on the right. Navigation (including the way
// home) lives in the app sidebar, so the header carries none.
export function PageHeader({ eyebrow, title, wide = false, children }: Props) {
  return (
    <header className="border-surface-300 w-full border-b-2 px-4 py-5 sm:px-6">
      <div
        className={`mx-auto flex w-full flex-wrap items-center justify-between gap-4 ${
          wide ? "max-w-6xl" : "max-w-2xl"
        }`}
      >
        <div className="min-w-0">
          <h1 className="text-ink-900 text-3xl">{title}</h1>
          {eyebrow && <p className="text-ink-500 text-sm">{eyebrow}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
