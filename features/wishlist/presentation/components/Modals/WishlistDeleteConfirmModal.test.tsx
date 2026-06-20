import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WishlistDeleteConfirmModal } from "./WishlistDeleteConfirmModal";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";
import { CATEGORIES } from "@/features/wishlist/data";

const item: WishlistItem = {
  id: "1",
  title: "Auriculares Sony",
  brand: "Sony",
  description: "Desc",
  emoji: "🎧",
  category: CATEGORIES.tech,
  price: 50000,
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("WishlistDeleteConfirmModal", () => {
  it("does not show content when item is null", () => {
    render(<WishlistDeleteConfirmModal item={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByText("Eliminar")).toBeNull();
  });

  it("shows item title when open", () => {
    render(<WishlistDeleteConfirmModal item={item} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/Auriculares Sony/)).toBeTruthy();
  });

  it("has Cancelar and Eliminar buttons", () => {
    render(<WishlistDeleteConfirmModal item={item} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Cancelar")).toBeTruthy();
    expect(screen.getByText("Eliminar")).toBeTruthy();
  });

  it("Cancelar calls onCancel and not onConfirm", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<WishlistDeleteConfirmModal item={item} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Eliminar calls onConfirm and not onCancel", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<WishlistDeleteConfirmModal item={item} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Eliminar"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
