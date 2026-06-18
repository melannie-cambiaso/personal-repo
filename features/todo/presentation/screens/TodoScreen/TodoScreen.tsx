"use client"

import { useState } from "react"
import type { TodoItem } from "@/features/todo/domain/TodoItem"
import { TodoAddItemModal, TodoList } from "../../components"
import { useTodo } from "../../hooks/useTodo"

interface Props {
  initialItems: TodoItem[]
  isOwner: boolean
  onAdd: (items: TodoItem[]) => Promise<void> | void
  onToggle: (items: TodoItem[]) => Promise<void> | void
}

export function TodoScreen({ initialItems, isOwner, onAdd, onToggle }: Props) {
  const { items, addItem, toggle, pending } = useTodo({ initialItems, onAdd, onToggle })
  const [isOpen, setIsOpen] = useState(false)

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-cream-200 bg-cream-50 px-6 py-5">
        <div className="mx-auto flex max-w-350 items-center justify-between">
          <div>
            <h1 className="font-dancing text-3xl font-bold text-brown-900">To-Do</h1>
            <p className="mt-1 text-sm text-brown-400">
              {pending} tarea{pending !== 1 ? "s" : ""} pendiente{pending !== 1 ? "s" : ""}
            </p>
          </div>
          {isOwner && (
            <button
              onClick={() => setIsOpen(true)}
              className="text-2xs cursor-pointer rounded-xl bg-brown-800 px-4 py-2 font-bold text-white transition-colors hover:bg-brown-700"
            >
              + Nueva tarea
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-350 px-6 py-10">
        <TodoList items={items} onToggle={toggle} />
      </div>

      {isOwner && (
        <TodoAddItemModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onAdd={addItem}
          existingItems={items}
        />
      )}
    </main>
  )
}

export default TodoScreen
