"use client";

interface Props {
  onClick: () => void;
  label?: string;
}

export function AddButton({ onClick, label = "Agregar" }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-brown-800 text-cream-100 shadow-card hover:bg-brown-700 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-2xl font-bold transition-colors"
      aria-label={label}
    >
      +
    </button>
  );
}
