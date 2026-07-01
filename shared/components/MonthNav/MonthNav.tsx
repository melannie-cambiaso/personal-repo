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
        className="border-cream-400 text-brown-600 hover:border-brown-400 hover:text-brown-900 cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors"
      >
        ← Anterior
      </button>
      <span className="font-dancing text-brown-900 text-xl font-bold capitalize">{label}</span>
      <button
        type="button"
        onClick={onNext}
        className="border-cream-400 text-brown-600 hover:border-brown-400 hover:text-brown-900 cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors"
      >
        Siguiente →
      </button>
    </div>
  );
}
