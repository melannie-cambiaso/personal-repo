"use client"

import type { TodoItem } from "@/features/todo/domain/TodoItem"

interface Props {
  items: TodoItem[]
  onToggle: (id: string) => void
}

export function TodoList({ items, onToggle }: Props) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-brown-400">
        No hay tareas todavía. ¡Agregá la primera!
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item.id}
          onClick={() => onToggle(item.id)}
          className="flex cursor-pointer items-center gap-4 rounded-xl border border-cream-300 bg-white px-5 py-4 shadow-sm transition-colors hover:border-brown-300"
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
          <span
            className={`text-sm font-medium transition-colors ${
              item.completed ? "text-brown-300 line-through" : "text-brown-900"
            }`}
          >
            {item.title}
          </span>
        </li>
      ))}
    </ul>
  )
}
