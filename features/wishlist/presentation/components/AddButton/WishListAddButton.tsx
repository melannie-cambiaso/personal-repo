"use client";

interface Props {
  onClick: () => void;
}

export function WishListAddButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-brown-800 hover:bg-brown-700 text-cream-100 flex items-center justify-center rounded-full p-4 text-2xl font-bold shadow-card transition-colors cursor-pointer"
      aria-label="Agregar item"
    >
      +
    </button>
  );
}
