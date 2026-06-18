import "server-only"
import { Redis } from "@upstash/redis"
import type { TodoItem } from "../domain/TodoItem"

// ponytail: duplicates Redis setup from wishlist/data/kvAdapter — extract to shared/kv.ts if a third feature needs it
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const KEY = "todo-items"

export async function loadTodoItems(): Promise<TodoItem[]> {
  try {
    const data = await redis.get<TodoItem[]>(KEY)
    return data ?? []
  } catch {
    return []
  }
}

export async function saveTodoItems(items: TodoItem[]): Promise<void> {
  try {
    await redis.set(KEY, items)
  } catch (e) {
    console.error("todoItems.save failed", e)
  }
}
