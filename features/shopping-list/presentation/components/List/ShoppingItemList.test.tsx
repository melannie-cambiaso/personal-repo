import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShoppingItemList } from "./ShoppingItemList";
import type { CategoryGroup } from "@/features/shopping-list/domain";

const makeGroup = (overrides: Partial<CategoryGroup> = {}): CategoryGroup => ({
  category: { id: "cat-1", name: "Limpieza", createdAt: "2026-01-01T00:00:00Z" },
  items: [],
  ...overrides,
});

const baseProps = {
  isOwner: true,
  onCheckItem: vi.fn(),
  onEditItem: vi.fn(),
  onDeleteItem: vi.fn(),
};

describe("ShoppingItemList", () => {
  it("renders the 'no categories yet' empty state when grouped is empty", () => {
    render(<ShoppingItemList {...baseProps} grouped={[]} activeCategoryId={null} />);
    expect(screen.getByText(/todav.a no hay categor.as/i)).toBeTruthy();
  });

  it("renders the empty-category state when the active category has 0 items", () => {
    const grouped = [makeGroup({ items: [] })];
    render(<ShoppingItemList {...baseProps} grouped={grouped} activeCategoryId="cat-1" />);
    expect(screen.getByText(/todav.a no tiene productos/i)).toBeTruthy();
  });

  it("renders one row per item in the active category", () => {
    const grouped = [
      makeGroup({
        category: { id: "cat-1", name: "Limpieza", createdAt: "2026-01-01T00:00:00Z" },
        items: [
          { id: "1", name: "Jabón", categoryId: "cat-1", checked: false, createdAt: "2026-01-01T00:00:00Z" },
          { id: "2", name: "Lavandina", categoryId: "cat-1", checked: false, createdAt: "2026-01-01T00:00:00Z" },
        ],
      }),
    ];
    render(<ShoppingItemList {...baseProps} grouped={grouped} activeCategoryId="cat-1" />);
    expect(screen.getByText("Jabón")).toBeTruthy();
    expect(screen.getByText("Lavandina")).toBeTruthy();
  });

  it("only renders items belonging to the active category, not other categories'", () => {
    const grouped = [
      makeGroup({
        category: { id: "cat-1", name: "Limpieza", createdAt: "2026-01-01T00:00:00Z" },
        items: [
          { id: "1", name: "Jabón", categoryId: "cat-1", checked: false, createdAt: "2026-01-01T00:00:00Z" },
        ],
      }),
      makeGroup({
        category: { id: "cat-2", name: "Supermercado", createdAt: "2026-01-01T00:00:00Z" },
        items: [
          { id: "2", name: "Leche", categoryId: "cat-2", checked: false, createdAt: "2026-01-01T00:00:00Z" },
        ],
      }),
    ];
    render(<ShoppingItemList {...baseProps} grouped={grouped} activeCategoryId="cat-2" />);
    expect(screen.getByText("Leche")).toBeTruthy();
    expect(screen.queryByText("Jabón")).toBeNull();
  });

  it("calls onCheckItem when a row's checkbox is toggled", () => {
    const onCheckItem = vi.fn();
    const grouped = [
      makeGroup({
        items: [
          { id: "1", name: "Jabón", categoryId: "cat-1", checked: false, createdAt: "2026-01-01T00:00:00Z" },
        ],
      }),
    ];
    render(
      <ShoppingItemList
        {...baseProps}
        grouped={grouped}
        activeCategoryId="cat-1"
        onCheckItem={onCheckItem}
      />
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onCheckItem).toHaveBeenCalledWith("1");
  });

  it("hides row edit/delete controls and disables checkboxes when isOwner is false", () => {
    const grouped = [
      makeGroup({
        items: [
          { id: "1", name: "Jabón", categoryId: "cat-1", checked: false, createdAt: "2026-01-01T00:00:00Z" },
        ],
      }),
    ];
    render(
      <ShoppingItemList {...baseProps} grouped={grouped} activeCategoryId="cat-1" isOwner={false} />
    );
    expect(screen.queryByRole("button", { name: /editar/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
    expect((screen.getByRole("checkbox") as HTMLInputElement).disabled).toBe(true);
  });
});
