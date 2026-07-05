import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditItemModal } from "./EditItemModal";
import type { ShoppingCategory, ShoppingItem } from "@/features/shopping-list/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const categories: ShoppingCategory[] = [
  { id: "cat-1", name: "Limpieza", createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat-2", name: "Supermercado", createdAt: "2026-01-02T00:00:00Z" },
];

const item: ShoppingItem = {
  id: "item-1",
  name: "Detergente",
  categoryId: "cat-1",
  checked: false,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("EditItemModal", () => {
  it("pre-fills the name field and the category select from the item", () => {
    render(<EditItemModal item={item} categories={categories} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByDisplayValue("Detergente")).toBeTruthy();
    const select = screen.getByRole("combobox", { hidden: true }) as HTMLSelectElement;
    expect(select.value).toBe("cat-1");
  });

  it("populates the category select with one option per category", () => {
    render(<EditItemModal item={item} categories={categories} onClose={vi.fn()} onSave={vi.fn()} />);
    const select = screen.getByRole("combobox", { hidden: true }) as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((o) => o.textContent);
    expect(optionLabels).toEqual(["Limpieza", "Supermercado"]);
  });

  it("calls onSave with the id and updated data, then closes", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <EditItemModal item={item} categories={categories} onClose={onClose} onSave={onSave} />
    );
    fireEvent.change(screen.getByDisplayValue("Detergente"), {
      target: { value: "  Lavandina  " },
    });
    fireEvent.change(screen.getByRole("combobox", { hidden: true }), {
      target: { value: "cat-2" },
    });
    fireEvent.submit(container.querySelector("form")!);
    expect(onSave).toHaveBeenCalledWith("item-1", { name: "Lavandina", categoryId: "cat-2" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows a validation error and does not call onSave when the name is cleared", () => {
    const onSave = vi.fn();
    const { container } = render(
      <EditItemModal item={item} categories={categories} onClose={vi.fn()} onSave={onSave} />
    );
    fireEvent.change(screen.getByDisplayValue("Detergente"), { target: { value: "   " } });
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByText(/nombre es obligatorio/i)).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});
