import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddItemModal } from "./AddItemModal";
import type { ShoppingCategory } from "@/features/shopping-list/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const categories: ShoppingCategory[] = [
  { id: "cat-1", name: "Limpieza", createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat-2", name: "Supermercado", createdAt: "2026-01-02T00:00:00Z" },
];

describe("AddItemModal", () => {
  it("populates the category select with one option per category", () => {
    render(<AddItemModal isOpen categories={categories} onClose={vi.fn()} onAdd={vi.fn()} />);
    const select = screen.getByRole("combobox", { hidden: true }) as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((o) => o.textContent);
    expect(optionLabels).toEqual(["Limpieza", "Supermercado"]);
  });

  it("shows a validation error and does not call onAdd when the name is blank", () => {
    const onAdd = vi.fn();
    const { container } = render(
      <AddItemModal isOpen categories={categories} onClose={vi.fn()} onAdd={onAdd} />
    );
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByText(/nombre es obligatorio/i)).toBeTruthy();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("defaults categoryId to the first category so submitting with only a name succeeds", () => {
    const onAdd = vi.fn();
    const { container } = render(
      <AddItemModal isOpen categories={categories} onClose={vi.fn()} onAdd={onAdd} />
    );
    fireEvent.change(screen.getByPlaceholderText(/detergente/i), {
      target: { value: "Detergente" },
    });
    fireEvent.submit(container.querySelector("form")!);
    expect(onAdd).toHaveBeenCalledWith({ name: "Detergente", categoryId: "cat-1" });
  });

  it("defaults categoryId to the currently active category when provided", () => {
    const onAdd = vi.fn();
    const { container } = render(
      <AddItemModal
        isOpen
        categories={categories}
        defaultCategoryId="cat-2"
        onClose={vi.fn()}
        onAdd={onAdd}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/detergente/i), {
      target: { value: "Papel" },
    });
    fireEvent.submit(container.querySelector("form")!);
    expect(onAdd).toHaveBeenCalledWith({ name: "Papel", categoryId: "cat-2" });
  });

  it("calls onAdd with the trimmed name and selected categoryId, then closes", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <AddItemModal isOpen categories={categories} onClose={onClose} onAdd={onAdd} />
    );
    fireEvent.change(screen.getByPlaceholderText(/detergente/i), {
      target: { value: "  Lavandina  " },
    });
    fireEvent.change(screen.getByRole("combobox", { hidden: true }), {
      target: { value: "cat-2" },
    });
    fireEvent.submit(container.querySelector("form")!);
    expect(onAdd).toHaveBeenCalledWith({ name: "Lavandina", categoryId: "cat-2" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
