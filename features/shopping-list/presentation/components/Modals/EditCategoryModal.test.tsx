import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditCategoryModal } from "./EditCategoryModal";
import type { ShoppingCategory } from "@/features/shopping-list/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const category: ShoppingCategory = {
  id: "cat-1",
  name: "Limpieza",
  createdAt: "2026-01-01T00:00:00Z",
};

describe("EditCategoryModal", () => {
  it("pre-fills the name field from the category", () => {
    render(<EditCategoryModal category={category} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByDisplayValue("Limpieza")).toBeTruthy();
  });

  it("calls onSave with the id and trimmed name, then closes", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <EditCategoryModal category={category} onClose={onClose} onSave={onSave} />
    );
    fireEvent.change(screen.getByDisplayValue("Limpieza"), {
      target: { value: "  Farmacia  " },
    });
    fireEvent.submit(container.querySelector("form")!);
    expect(onSave).toHaveBeenCalledWith("cat-1", "Farmacia");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows a validation error and does not call onSave when the name is cleared", () => {
    const onSave = vi.fn();
    const { container } = render(
      <EditCategoryModal category={category} onClose={vi.fn()} onSave={onSave} />
    );
    fireEvent.change(screen.getByDisplayValue("Limpieza"), { target: { value: "   " } });
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByText(/nombre es obligatorio/i)).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});
