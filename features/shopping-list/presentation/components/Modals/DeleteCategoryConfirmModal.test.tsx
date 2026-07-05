import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteCategoryConfirmModal } from "./DeleteCategoryConfirmModal";
import type { ShoppingCategory, ShoppingItem } from "@/features/shopping-list/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const category: ShoppingCategory = {
  id: "cat-1",
  name: "Limpieza",
  createdAt: "2026-01-01T00:00:00Z",
};

const makeItem = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: "item-1",
  name: "Detergente",
  categoryId: "cat-1",
  checked: false,
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("DeleteCategoryConfirmModal", () => {
  it("does not render content when category is null", () => {
    render(
      <DeleteCategoryConfirmModal
        category={null}
        items={[]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByText("Limpieza")).toBeNull();
  });

  it("allows deletion when the category has no items: shows confirm button and calls onConfirm", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <DeleteCategoryConfirmModal
        category={category}
        items={[]}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText("Eliminar"));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("blocks deletion when the category has items: shows a blocked message and no confirm action fires", () => {
    const onConfirm = vi.fn();
    const items = [makeItem({ categoryId: "cat-1" })];
    render(
      <DeleteCategoryConfirmModal
        category={category}
        items={items}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/todavía tiene productos/i)).toBeTruthy();
    expect(screen.queryByText("Eliminar")).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("allows deletion when items belong to a different category", () => {
    const onConfirm = vi.fn();
    const items = [makeItem({ categoryId: "other-category" })];
    render(
      <DeleteCategoryConfirmModal
        category={category}
        items={items}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Eliminar"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("Cancelar calls onCancel and not onConfirm", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <DeleteCategoryConfirmModal
        category={category}
        items={[]}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
