import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TodoList } from "./TodoList";
import type { TodoItem } from "@/features/todo/domain/TodoItem";

const pending = (id: string, title: string): TodoItem => ({
  id,
  title,
  completed: false,
  createdAt: new Date().toISOString(),
});

const completed = (id: string, title: string, completedBy?: string): TodoItem => ({
  id,
  title,
  completed: true,
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  completedBy,
});

describe("TodoList", () => {
  it("shows empty state when no items", () => {
    render(<TodoList items={[]} onToggle={() => {}} />);
    expect(screen.getByText("No hay tareas todavía. ¡Agregá la primera!")).toBeDefined();
  });

  it("renders pending items", () => {
    render(<TodoList items={[pending("1", "Comprar leche")]} onToggle={() => {}} />);
    expect(screen.getByText("Comprar leche")).toBeDefined();
  });

  it("clicking a pending item shows person picker", () => {
    render(<TodoList items={[pending("1", "Comprar leche")]} onToggle={() => {}} />);
    fireEvent.click(screen.getByText("Comprar leche"));
    expect(screen.getByText("Pedro")).toBeDefined();
    expect(screen.getByText("Meme")).toBeDefined();
  });

  it("clicking the same pending item again hides the picker", () => {
    render(<TodoList items={[pending("1", "Comprar leche")]} onToggle={() => {}} />);
    fireEvent.click(screen.getByText("Comprar leche"));
    fireEvent.click(screen.getByText("Comprar leche"));
    expect(screen.queryByText("Pedro")).toBeNull();
  });

  it("selecting a person calls onToggle with id and name", () => {
    const onToggle = vi.fn();
    render(<TodoList items={[pending("1", "Comprar leche")]} onToggle={onToggle} />);
    fireEvent.click(screen.getByText("Comprar leche"));
    fireEvent.click(screen.getByText("Pedro"));
    expect(onToggle).toHaveBeenCalledWith("1", "Pedro");
  });

  it("picker hides after selecting a person", () => {
    render(<TodoList items={[pending("1", "Comprar leche")]} onToggle={() => {}} />);
    fireEvent.click(screen.getByText("Comprar leche"));
    fireEvent.click(screen.getByText("Pedro"));
    expect(screen.queryByText("Meme")).toBeNull();
  });

  it("clicking a completed item calls onToggle without person", () => {
    const onToggle = vi.fn();
    render(<TodoList items={[completed("1", "Comprar leche", "Pedro")]} onToggle={onToggle} />);
    fireEvent.click(screen.getByText("Comprar leche"));
    expect(onToggle).toHaveBeenCalledWith("1");
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("does not show picker when clicking a completed item", () => {
    const onToggle = vi.fn();
    render(<TodoList items={[completed("1", "Comprar leche", "Pedro")]} onToggle={onToggle} />);
    fireEvent.click(screen.getByText("Comprar leche"));
    expect(screen.queryByText("¿Quién?")).toBeNull();
  });

  it("shows completedBy name when item is completed", () => {
    render(<TodoList items={[completed("1", "Comprar leche", "Meme")]} onToggle={() => {}} />);
    expect(screen.getByText("Meme")).toBeDefined();
  });
});
