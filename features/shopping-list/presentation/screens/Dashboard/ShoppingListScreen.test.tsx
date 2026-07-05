import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ShoppingListScreen } from "./ShoppingListScreen";
import type { ShoppingCategory, ShoppingItem } from "@/features/shopping-list/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const categories: ShoppingCategory[] = [
  { id: "cat-1", name: "Limpieza", createdAt: "2026-01-01T00:00:00Z" },
];

const items: ShoppingItem[] = [
  { id: "item-1", name: "Lavandina", categoryId: "cat-1", checked: false, createdAt: "2026-01-01T00:00:00Z" },
  { id: "item-2", name: "Detergente", categoryId: "cat-1", checked: false, createdAt: "2026-01-02T00:00:00Z" },
];

describe("ShoppingListScreen", () => {
  it("resets the EditItemModal form when switching the edit target without unmounting the screen", () => {
    render(
      <ShoppingListScreen
        initialCategories={categories}
        initialItems={items}
        isOwner={true}
        onSaveCategories={vi.fn()}
        onSaveItems={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar Lavandina" }));
    const firstDialog = screen.getByText("Editar producto").closest("dialog")!;
    expect(within(firstDialog).getByDisplayValue("Lavandina")).toBeTruthy();

    fireEvent.click(within(firstDialog).getByLabelText("Cerrar"));

    fireEvent.click(screen.getByRole("button", { name: "Editar Detergente" }));
    // Re-query: the `key={editingItem?.id}` prop should have forced a remount,
    // so this must be a NEW dialog node — proves the form wasn't reused stale.
    const secondDialog = screen.getByText("Editar producto").closest("dialog")!;
    expect(within(secondDialog).getByDisplayValue("Detergente")).toBeTruthy();
    expect(within(secondDialog).queryByDisplayValue("Lavandina")).toBeNull();
  });

  it("resets the EditCategoryModal form when switching the edit target without unmounting the screen", () => {
    const twoCategories: ShoppingCategory[] = [
      { id: "cat-1", name: "Limpieza", createdAt: "2026-01-01T00:00:00Z" },
      { id: "cat-2", name: "Supermercado", createdAt: "2026-01-02T00:00:00Z" },
    ];

    render(
      <ShoppingListScreen
        initialCategories={twoCategories}
        initialItems={[]}
        isOwner={true}
        onSaveCategories={vi.fn()}
        onSaveItems={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Renombrar Limpieza" }));
    const firstDialog = screen.getByText("Editar categoría").closest("dialog")!;
    expect(within(firstDialog).getByDisplayValue("Limpieza")).toBeTruthy();

    fireEvent.click(within(firstDialog).getByLabelText("Cerrar"));

    fireEvent.click(screen.getByRole("button", { name: "Supermercado" }));
    fireEvent.click(screen.getByRole("button", { name: "Renombrar Supermercado" }));
    // Re-query: the `key={editingCategory?.id}` prop should have forced a remount,
    // so this must be a NEW dialog node — proves the form wasn't reused stale.
    const secondDialog = screen.getByText("Editar categoría").closest("dialog")!;
    expect(within(secondDialog).getByDisplayValue("Supermercado")).toBeTruthy();
    expect(within(secondDialog).queryByDisplayValue("Limpieza")).toBeNull();
  });

  it("hides all mutation controls for a visitor (isOwner=false)", () => {
    render(
      <ShoppingListScreen
        initialCategories={categories}
        initialItems={items}
        isOwner={false}
        onSaveCategories={vi.fn()}
        onSaveItems={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: /Editar/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Eliminar/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Renombrar/ })).toBeNull();
    expect(screen.queryByLabelText("Agregar categoría")).toBeNull();
    expect(screen.queryByLabelText("Agregar producto")).toBeNull();
  });
});
