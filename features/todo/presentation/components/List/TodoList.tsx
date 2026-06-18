"use client"

import { useState } from "react"
import type { TodoItem } from "@/features/todo/domain/TodoItem"

const PEOPLE = ["Pedro", "Meme"] as const

interface Props {
  items: TodoItem[]
  onToggle: (id: string, completedBy?: string) => void
}

export function TodoList({ items, onToggle }: Props) {
  const [pickingId, setPickingId] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-brown-400">
        No hay tareas todavía. ¡Agregá la primera!
      </p>
    )
  }

  const handleItemClick = (item: TodoItem) => {
    if (item.completed) {
      onToggle(item.id)
      return
    }
    setPickingId(pickingId === item.id ? null : item.id)
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col overflow-hidden rounded-xl border border-cream-300 bg-white shadow-sm"
        >
          <div
            onClick={() => handleItemClick(item)}
            className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-cream-50"
          >
            <span
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                item.completed
                  ? "border-brown-600 bg-brown-600"
                  : "border-cream-400 bg-white"
              }`}
            >
              {item.completed && (
                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <div className="flex flex-1 flex-col">
              <span
                className={`text-sm font-medium transition-colors ${
                  item.completed ? "text-brown-300 line-through" : "text-brown-900"
                }`}
              >
                {item.title}
              </span>
              {item.completed && item.completedBy && (
                <span className="mt-0.5 text-xs text-brown-400">{item.completedBy}</span>
              )}
            </div>
          </div>

          {pickingId === item.id && (
            <div className="flex items-center gap-3 border-t border-cream-200 bg-cream-50 px-5 py-3">
              <span className="text-2xs font-semibold uppercase tracking-store text-brown-400">
                ¿Quién?
              </span>
              {PEOPLE.map((person) => (
                <button
                  key={person}
                  onClick={() => {
                    onToggle(item.id, person)
                    setPickingId(null)
                  }}
                  className="text-2xs cursor-pointer rounded-lg bg-brown-800 px-4 py-1.5 font-bold text-white transition-colors hover:bg-brown-700"
                >
                  {person}
                </button>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
