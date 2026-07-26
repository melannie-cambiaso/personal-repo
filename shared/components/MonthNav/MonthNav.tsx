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
        className="border-cream-400 text-brown-600 hover:border-brown-400 hover:text-brown-900 cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        ← Anterior
      </button>
      <span className="font-dancing text-brown-900 text-xl font-bold capitalize">{label}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="border-cream-400 text-brown-600 hover:border-brown-400 hover:text-brown-900 cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        Siguiente →
      </button>
    </div>
  );
}
