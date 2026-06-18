import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useTodo } from "./useTodo"
import type { TodoItem } from "@/features/todo/domain/TodoItem"

const makeItem = (id: string, completed = false): TodoItem => ({
  id,
  title: `Task ${id}`,
  completed,
  createdAt: new Date().toISOString(),
})

describe("useTodo", () => {
  it("returns initial items", () => {
    const items = [makeItem("1"), makeItem("2")]
    const { result } = renderHook(() =>
      useTodo({ initialItems: items, onAdd: vi.fn(), onToggle: vi.fn() })
    )
    expect(result.current.items).toHaveLength(2)
    expect(result.current.pending).toBe(2)
  })

  it("adds an item to the top of the list", () => {
    const onAdd = vi.fn()
    const { result } = renderHook(() =>
      useTodo({ initialItems: [makeItem("1")], onAdd, onToggle: vi.fn() })
    )
    act(() => result.current.addItem(makeItem("2")))
    expect(result.current.items[0].id).toBe("2")
    expect(onAdd).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: "2" })]))
  })

  it("completes an item with attribution", () => {
    const onToggle = vi.fn()
    const { result } = renderHook(() =>
      useTodo({ initialItems: [makeItem("1")], onAdd: vi.fn(), onToggle })
    )
    act(() => result.current.toggle("1", "Pedro"))
    const item = result.current.items.find((i) => i.id === "1")!
    expect(item.completed).toBe(true)
    expect(item.completedBy).toBe("Pedro")
    expect(item.completedAt).toBeDefined()
    expect(result.current.pending).toBe(0)
  })

  it("reverts a completed item without picker", () => {
    const { result } = renderHook(() =>
      useTodo({ initialItems: [makeItem("1", true)], onAdd: vi.fn(), onToggle: vi.fn() })
    )
    act(() => result.current.toggle("1"))
    const item = result.current.items.find((i) => i.id === "1")!
    expect(item.completed).toBe(false)
    expect(item.completedBy).toBeUndefined()
    expect(item.completedAt).toBeUndefined()
  })
})
