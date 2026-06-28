"use client";

interface Props {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNav({ label, onPrev, onNext }: Props) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <button
        type="button"
        onClick={onPrev}
        className="cursor-pointer rounded-lg border border-cream-400 px-3 py-1.5 text-sm text-brown-600 transition-colors hover:border-brown-400 hover:text-brown-900"
      >
        ← Anterior
      </button>
      <span className="font-dancing text-xl font-bold capitalize text-brown-900">{label}</span>
      <button
        type="button"
        onClick={onNext}
        className="cursor-pointer rounded-lg border border-cream-400 px-3 py-1.5 text-sm text-brown-600 transition-colors hover:border-brown-400 hover:text-brown-900"
      >
        Siguiente →
      </button>
    </div>
  );
}
