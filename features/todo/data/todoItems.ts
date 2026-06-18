import "server-only"
import { Redis } from "@upstash/redis"
import type { TodoItem } from "../domain/TodoItem"
import type { TodoHistoryItem } from "../domain/TodoHistoryItem"

// ponytail: duplicates Redis setup from wishlist/data/kvAdapter — extract to shared/kv.ts if a third feature needs it
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const ITEMS_KEY = "todo-items"
const HISTORY_KEY = "todo-history"
const ROLLOVER_DATE_KEY = "todo-rollover-date"

export async function loadTodoItems(): Promise<TodoItem[]> {
  try {
    const data = await redis.get<TodoItem[]>(ITEMS_KEY)
    return data ?? []
  } catch {
    return []
  }
}

export async function saveTodoItems(items: TodoItem[]): Promise<void> {
  try {
    await redis.set(ITEMS_KEY, items)
  } catch (e) {
    console.error("todoItems.save failed", e)
  }
}

export async function loadTodoHistory(): Promise<TodoHistoryItem[]> {
  try {
    const data = await redis.get<TodoHistoryItem[]>(HISTORY_KEY)
    return data ?? []
  } catch {
    return []
  }
}

export async function saveTodoHistory(items: TodoHistoryItem[]): Promise<void> {
  try {
    await redis.set(HISTORY_KEY, items)
  } catch (e) {
    console.error("todoHistory.save failed", e)
  }
}

export async function runRolloverIfNeeded(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const stored = await redis.get<string>(ROLLOVER_DATE_KEY)
  if (stored === today) return

  const items = await loadTodoItems()
  const completed = items.filter((i) => i.completed)

  if (completed.length > 0) {
    const history = await loadTodoHistory()
    const newEntries: TodoHistoryItem[] = completed.map((i) => ({
      id: i.id,
      title: i.title,
      completedAt: i.completedAt!,
      completedBy: i.completedBy!,
      originalDate: stored ?? today,
    }))
    await saveTodoHistory([...newEntries, ...history])
    await saveTodoItems(items.filter((i) => !i.completed))
  }

  await redis.set(ROLLOVER_DATE_KEY, today)
}
