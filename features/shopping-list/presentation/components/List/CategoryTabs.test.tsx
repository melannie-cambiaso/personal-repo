import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryTabs } from "./CategoryTabs";
import type { ShoppingCategory } from "@/features/shopping-list/domain";

const makeCategory = (overrides: Partial<ShoppingCategory> = {}): ShoppingCategory => ({
  id: "cat-1",
  name: "Limpieza",
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const baseProps = {
  isOwner: true,
  activeCategoryId: "cat-1",
  onSelect: vi.fn(),
  onAddCategory: vi.fn(),
  onRenameCategory: vi.fn(),
  onDeleteCategory: vi.fn(),
};

describe("CategoryTabs", () => {
  it("renders one tab per category in fixed insertion order", () => {
    const categories = [
      makeCategory({ id: "1", name: "Limpieza" }),
      makeCategory({ id: "2", name: "Supermercado" }),
      makeCategory({ id: "3", name: "Farmacia" }),
    ];
    render(<CategoryTabs {...baseProps} categories={categories} />);
    const tabs = screen.getAllByRole("button", {
      name: /^(Limpieza|Supermercado|Farmacia)$/,
    });
    expect(tabs.map((t) => t.textContent)).toEqual(["Limpieza", "Supermercado", "Farmacia"]);
  });

  it("calls onSelect with the category id when a tab is clicked", () => {
    const onSelect = vi.fn();
    const categories = [makeCategory({ id: "1", name: "Limpieza" })];
    render(
      <CategoryTabs {...baseProps} categories={categories} activeCategoryId={null} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Limpieza" }));
    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("marks the active tab with aria-pressed=true and others false", () => {
    const categories = [
      makeCategory({ id: "1", name: "Limpieza" }),
      makeCategory({ id: "2", name: "Supermercado" }),
    ];
    render(<CategoryTabs {...baseProps} categories={categories} activeCategoryId="2" />);
    expect(screen.getByRole("button", { name: "Limpieza" }).getAttribute("aria-pressed")).toBe(
      "false"
    );
    expect(
      screen.getByRole("button", { name: "Supermercado" }).getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("shows rename/delete controls only for the active tab when owner", () => {
    const categories = [
      makeCategory({ id: "1", name: "Limpieza" }),
      makeCategory({ id: "2", name: "Supermercado" }),
    ];
    render(<CategoryTabs {...baseProps} categories={categories} activeCategoryId="1" />);
    expect(screen.getByRole("button", { name: /renombrar limpieza/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /eliminar limpieza/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /renombrar supermercado/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /eliminar supermercado/i })).toBeNull();
  });

  it("calls onRenameCategory and onDeleteCategory with the category object", () => {
    const onRenameCategory = vi.fn();
    const onDeleteCategory = vi.fn();
    const category = makeCategory({ id: "1", name: "Limpieza" });
    render(
      <CategoryTabs
        {...baseProps}
        categories={[category]}
        activeCategoryId="1"
        onRenameCategory={onRenameCategory}
        onDeleteCategory={onDeleteCategory}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /renombrar limpieza/i }));
    expect(onRenameCategory).toHaveBeenCalledWith(category);
    fireEvent.click(screen.getByRole("button", { name: /eliminar limpieza/i }));
    expect(onDeleteCategory).toHaveBeenCalledWith(category);
  });

  it("shows the add-category control for the owner and calls onAddCategory when clicked", () => {
    const onAddCategory = vi.fn();
    render(
      <CategoryTabs
        {...baseProps}
        categories={[]}
        activeCategoryId={null}
        onAddCategory={onAddCategory}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /agregar categor.a/i }));
    expect(onAddCategory).toHaveBeenCalledOnce();
  });

  it("does not render any controls for a visitor", () => {
    const categories = [makeCategory({ id: "1", name: "Limpieza" })];
    render(
      <CategoryTabs {...baseProps} categories={categories} activeCategoryId="1" isOwner={false} />
    );
    expect(screen.queryByRole("button", { name: /renombrar/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /agregar categor.a/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Limpieza" })).toBeTruthy();
  });

  it("renders nothing for a visitor when there are no categories", () => {
    const { container } = render(
      <CategoryTabs {...baseProps} categories={[]} activeCategoryId={null} isOwner={false} />
    );
    expect(container.firstChild).toBeNull();
  });
});
