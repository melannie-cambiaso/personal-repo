import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { TodoHistory } from "./TodoHistory"
import type { TodoHistoryItem } from "@/features/todo/domain/TodoHistoryItem"

const makeEntry = (id: string, completedBy: string): TodoHistoryItem => ({
  id,
  title: `Task ${id}`,
  completedAt: new Date("2026-06-01T10:00:00Z").toISOString(),
  completedBy,
  originalDate: "2026-06-01",
})

describe("TodoHistory", () => {
  it("renders nothing when history is empty", () => {
    const { container } = render(<TodoHistory history={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders a section when history has items", () => {
    render(<TodoHistory history={[makeEntry("1", "Pedro")]} />)
    expect(screen.getByText("Task 1")).toBeDefined()
    expect(screen.getByText("Pedro")).toBeDefined()
  })

  it("renders all history entries", () => {
    const history = [makeEntry("1", "Pedro"), makeEntry("2", "Meme")]
    render(<TodoHistory history={history} />)
    expect(screen.getByText("Task 1")).toBeDefined()
    expect(screen.getByText("Task 2")).toBeDefined()
    expect(screen.getByText("Meme")).toBeDefined()
  })
})
