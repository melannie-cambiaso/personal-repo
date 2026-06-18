"use client"

import { useEffect, useRef, useState } from "react"
import type { TodoItem } from "@/features/todo/domain/TodoItem"

interface Params {
  initialItems: TodoItem[]
  onAdd: (items: TodoItem[]) => Promise<void> | void
  onToggle: (items: TodoItem[]) => Promise<void> | void
}

export function useTodo({ initialItems, onAdd, onToggle }: Params) {
  const [items, setItems] = useState<TodoItem[]>(initialItems)
  const itemsRef = useRef(initialItems)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const addItem = (item: TodoItem) => {
    const next = [item, ...itemsRef.current]
    itemsRef.current = next
    setItems(next)
    void onAdd(next)
  }

  const toggle = (id: string) => {
    const next = itemsRef.current.map((i) =>
      i.id === id ? { ...i, completed: !i.completed } : i
    )
    itemsRef.current = next
    setItems(next)
    void onToggle(next)
  }

  const pending = items.filter((i) => !i.completed).length

  return { items, addItem, toggle, pending }
}
