"use client"

interface Props {
  onClick: () => void
  label?: string
}

export function AddButton({ onClick, label = "Agregar" }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-brown-800 text-2xl font-bold text-cream-100 shadow-card transition-colors hover:bg-brown-700"
      aria-label={label}
    >
      +
    </button>
  )
}
