import { loadTodoItems, saveTodoItems } from "@/features/todo/data"
import type { TodoItem } from "@/features/todo/domain"
import TodoScreen from "@/features/todo/presentation/screens/TodoScreen/TodoScreen"
import { cookies } from "next/headers"

async function handleAdd(items: TodoItem[]) {
  "use server"
  const cookieStore = await cookies()
  if (!cookieStore.get("wishlist_auth")?.value) return
  await saveTodoItems(items)
}

async function handleToggle(items: TodoItem[]) {
  "use server"
  await saveTodoItems(items)
}

export default async function TodoPage() {
  const cookieStore = await cookies()
  const isOwner = !!cookieStore.get("wishlist_auth")?.value
  const items = await loadTodoItems()

  return (
    <TodoScreen
      initialItems={items}
      isOwner={isOwner}
      onAdd={handleAdd}
      onToggle={handleToggle}
    />
  )
}
