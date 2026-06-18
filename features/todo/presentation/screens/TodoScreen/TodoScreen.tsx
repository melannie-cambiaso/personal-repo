"use client"

import { useState } from "react"
import type { TodoHistoryItem } from "@/features/todo/domain/TodoHistoryItem"
import type { TodoItem } from "@/features/todo/domain/TodoItem"
import { AddButton } from "@/shared/components/AddButton/AddButton"
import { PageHeader } from "@/shared/components/PageHeader/PageHeader"
import { TodoAddItemModal, TodoHistory, TodoList } from "../../components"
import { useTodo } from "../../hooks/useTodo"

interface Props {
  initialItems: TodoItem[]
  history: TodoHistoryItem[]
  isOwner: boolean
  onAdd: (items: TodoItem[]) => Promise<void> | void
  onToggle: (items: TodoItem[]) => Promise<void> | void
}

export function TodoScreen({ initialItems, history, isOwner, onAdd, onToggle }: Props) {
  const { items, addItem, toggle, pending } = useTodo({ initialItems, onAdd, onToggle })
  const [isOpen, setIsOpen] = useState(false)

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Tus tareas del día" title="To-Do">
        <div className="flex items-center justify-center gap-0">
          <div className="px-8 text-center">
            <span className="block text-xl font-bold text-cream-100">{pending}</span>
            <span className="block text-2xs uppercase tracking-eyebrow text-brown-300">
              Pendiente{pending !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="h-8 w-px bg-cream-100/20" />
          <div className="px-8 text-center">
            <span className="block text-xl font-bold text-cream-100">
              {items.filter((i) => i.completed).length}
            </span>
            <span className="block text-2xs uppercase tracking-eyebrow text-brown-300">
              Hecha{items.filter((i) => i.completed).length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-350 px-6 py-10">
        {isOwner && (
          <div className="mb-6 flex justify-end">
            <AddButton onClick={() => setIsOpen(true)} label="Agregar tarea" />
          </div>
        )}
        <TodoList items={items} onToggle={toggle} />
        <TodoHistory history={history} />
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
