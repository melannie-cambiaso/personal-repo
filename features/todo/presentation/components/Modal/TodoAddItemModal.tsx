"use client"

import { useEffect, useRef, useState } from "react"
import type { TodoItem } from "@/features/todo/domain/TodoItem"

interface Props {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: TodoItem) => void
  existingItems: TodoItem[]
}

export function TodoAddItemModal({ isOpen, onClose, onAdd, existingItems }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    isOpen ? dialog.showModal() : dialog.close()
  }, [isOpen])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    setSuggestions(
      val.length >= 2
        ? existingItems
            .filter((i) => i.title.toLowerCase().includes(val.toLowerCase()))
            .map((i) => i.title)
            .slice(0, 5)
        : []
    )
  }

  const handleBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    })
    setTitle("")
    setSuggestions([])
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-md rounded-2xl bg-cream-50 p-0 shadow-card-hover backdrop:bg-brown-900/40"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={handleBackdrop}
    >
      <div className="px-6 py-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-dancing text-2xl font-bold text-brown-900">Nueva tarea</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-xl text-brown-400 transition-colors hover:text-brown-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-2xs font-semibold uppercase tracking-store text-brown-400">
              Título *
            </span>
            <div className="relative">
              <input
                className="w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600"
                value={title}
                onChange={handleTitleChange}
                required
                autoFocus
                placeholder="Ej: Hacer las compras"
              />
              {suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-cream-300 bg-white shadow-sm">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          setTitle(s)
                          setSuggestions([])
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-brown-900 transition-colors hover:bg-cream-100"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-2xs cursor-pointer rounded-lg border border-brown-300 px-4 py-2 font-bold text-brown-600 transition-colors hover:bg-cream-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="text-2xs cursor-pointer rounded-lg bg-brown-800 px-4 py-2 font-bold text-white transition-colors hover:bg-brown-700"
            >
              Agregar ✓
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
