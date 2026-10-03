"use client";

interface Props {
  onClick: () => void;
  label?: string;
}

export function AddButton({ onClick, label = "Agregar" }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-brown-900 text-cream-50 shadow-card hover:bg-brown-800 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-3xl transition-colors"
      aria-label={label}
    >
      +
    </button>
  );
}
