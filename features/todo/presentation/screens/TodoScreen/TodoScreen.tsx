"use client";

import { useState } from "react";
import type { TodoHistoryItem } from "@/features/todo/domain/TodoHistoryItem";
import type { TodoItem } from "@/features/todo/domain/TodoItem";
import { AddButton, PageHeader } from "@/shared/components";
import { TodoAddItemModal, TodoHistory, TodoList } from "../../components";
import { useTodo } from "../../hooks/useTodo";

interface Props {
  initialItems: TodoItem[];
  history: TodoHistoryItem[];
  isOwner: boolean;
  onAdd: (items: TodoItem[]) => Promise<void> | void;
  onToggle: (items: TodoItem[]) => Promise<void> | void;
}

export function TodoScreen({ initialItems, history, isOwner, onAdd, onToggle }: Props) {
  const { items, addItem, toggle, pending } = useTodo({ initialItems, onAdd, onToggle });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Tus tareas del día" title="To-Do">
        <div className="flex items-center justify-center gap-0">
          <div className="px-8 text-center">
            <span className="text-cream-100 block text-xl font-bold">{pending}</span>
            <span className="text-2xs tracking-eyebrow text-brown-300 block uppercase">
              Pendiente{pending !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="bg-cream-100/20 h-8 w-px" />
          <div className="px-8 text-center">
            <span className="text-cream-100 block text-xl font-bold">
              {items.filter((i) => i.completed).length}
            </span>
            <span className="text-2xs tracking-eyebrow text-brown-300 block uppercase">
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
  );
}

export default TodoScreen;
