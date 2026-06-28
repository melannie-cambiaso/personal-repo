"use client"

import { useState } from "react"
import type { TodoItem } from "@/features/todo/domain/TodoItem"
import { ModalShell, Button, Field, Input } from "@/shared/components"

interface Props {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: TodoItem) => void
  existingItems: TodoItem[]
}

export function TodoAddItemModal({ isOpen, onClose, onAdd, existingItems }: Props) {
  const [title, setTitle] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])

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
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Nueva tarea">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Título *">
            <div className="relative">
              <Input
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
          </Field>

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" onPress={onClose} variant="secondary">
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Agregar ✓
            </Button>
          </div>
        </form>
    </ModalShell>
  )
}
