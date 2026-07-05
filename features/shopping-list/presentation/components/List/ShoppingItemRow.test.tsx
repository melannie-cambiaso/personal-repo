import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShoppingItemRow } from "./ShoppingItemRow";
import type { ShoppingItem } from "@/features/shopping-list/domain";

const makeItem = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: "item-1",
  name: "Leche",
  categoryId: "cat-1",
  checked: false,
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const baseProps = {
  isOwner: true,
  onCheck: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("ShoppingItemRow", () => {
  it("renders the item name", () => {
    render(<ShoppingItemRow {...baseProps} item={makeItem({ name: "Leche" })} />);
    expect(screen.getByText("Leche")).toBeTruthy();
  });

  it("calls onCheck with the item id when the checkbox is toggled", () => {
    const onCheck = vi.fn();
    render(<ShoppingItemRow {...baseProps} item={makeItem({ id: "item-7" })} onCheck={onCheck} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onCheck).toHaveBeenCalledWith("item-7");
  });

  it("shows edit and delete controls when isOwner is true", () => {
    render(<ShoppingItemRow {...baseProps} item={makeItem({ name: "Leche" })} />);
    expect(screen.getByRole("button", { name: /editar leche/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /eliminar leche/i })).toBeTruthy();
  });

  it("hides edit/delete controls and disables the checkbox when isOwner is false", () => {
    render(<ShoppingItemRow {...baseProps} item={makeItem({ name: "Leche" })} isOwner={false} />);
    expect(screen.queryByRole("button", { name: /editar leche/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /eliminar leche/i })).toBeNull();
    expect((screen.getByRole("checkbox") as HTMLInputElement).disabled).toBe(true);
  });

  it("calls onEdit with the item when the edit button is clicked", () => {
    const onEdit = vi.fn();
    const item = makeItem({ name: "Leche" });
    render(<ShoppingItemRow {...baseProps} item={item} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole("button", { name: /editar leche/i }));
    expect(onEdit).toHaveBeenCalledWith(item);
  });

  it("calls onDelete with the item when the delete button is clicked", () => {
    const onDelete = vi.fn();
    const item = makeItem({ name: "Leche" });
    render(<ShoppingItemRow {...baseProps} item={item} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: /eliminar leche/i }));
    expect(onDelete).toHaveBeenCalledWith(item);
  });
});
