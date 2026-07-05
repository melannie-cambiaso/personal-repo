import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteItemConfirmModal } from "./DeleteItemConfirmModal";
import type { ShoppingItem } from "@/features/shopping-list/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const item: ShoppingItem = {
  id: "item-1",
  name: "Detergente",
  categoryId: "cat-1",
  checked: false,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("DeleteItemConfirmModal", () => {
  it("does not show content when item is null", () => {
    render(<DeleteItemConfirmModal item={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByText("Detergente")).toBeNull();
  });

  it("shows item name when open", () => {
    render(<DeleteItemConfirmModal item={item} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/Detergente/)).toBeTruthy();
  });

  it("Cancelar calls onCancel and not onConfirm", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<DeleteItemConfirmModal item={item} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Eliminar calls onConfirm and not onCancel", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<DeleteItemConfirmModal item={item} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Eliminar"));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
