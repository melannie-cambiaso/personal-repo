"use client";

interface Props {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
}

export function MonthNav({ label, onPrev, onNext, disabled = false }: Props) {
  return (
    // Phones show the arrows only: the words stay in each button's accessible name
    // (sr-only) so screen readers and tests still get "← Anterior" / "Siguiente →".
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onPrev}
        disabled={disabled}
        className="border-surface-400 bg-surface-50 text-ink-600 hover:border-ink-400 hover:text-ink-900 cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
      >
        ← <span className="sr-only sm:not-sr-only">Anterior</span>
      </button>
      <span className="text-ink-900 text-xl whitespace-nowrap capitalize sm:text-2xl">{label}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="border-surface-400 bg-surface-50 text-ink-600 hover:border-ink-400 hover:text-ink-900 cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
      >
        <span className="sr-only sm:not-sr-only">Siguiente</span> →
      </button>
    </div>
  );
}
