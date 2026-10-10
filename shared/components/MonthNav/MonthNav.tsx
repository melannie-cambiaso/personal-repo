"use client";

interface Props {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
}

export function MonthNav({ label, onPrev, onNext, disabled = false }: Props) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={disabled}
        className="border-surface-400 bg-surface-50 text-ink-600 hover:border-ink-400 hover:text-ink-900 cursor-pointer rounded-full border-2 px-4 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        ← Anterior
      </button>
      <span className="text-ink-900 text-2xl capitalize">
        {label}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="border-surface-400 bg-surface-50 text-ink-600 hover:border-ink-400 hover:text-ink-900 cursor-pointer rounded-full border-2 px-4 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        Siguiente →
      </button>
    </div>
  );
}
