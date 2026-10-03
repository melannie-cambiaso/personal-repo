import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardScreen } from "./DashboardScreen";
import type { WishlistItem } from "@/features/wishlist/domain";
import { CATEGORIES } from "@/features/wishlist/data";

const items: WishlistItem[] = [
  { id: "low", title: "Lámpara", category: CATEGORIES.home, price: 10000, priority: "low" },
  { id: "legacy", title: "Libro", category: CATEGORIES.books, price: null },
  { id: "owned", title: "Audífonos", category: CATEGORIES.tech, price: 5000, priority: "high" },
  { id: "high", title: "Zapatillas", category: CATEGORIES.cloth, price: 30000, priority: "high" },
];

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

function renderScreen(isOwner = true) {
  render(
    <DashboardScreen
      initialItems={items}
      initialOwnedIds={["owned"]}
      isOwner={isOwner}
      onAdd={vi.fn()}
      onToggle={vi.fn()}
    />
  );
}

const rowTitles = () => screen.getAllByRole("checkbox").map((c) => c.getAttribute("aria-label"));

describe("DashboardScreen", () => {
  it("lists items by priority by default, with owned items last", () => {
    renderScreen();

    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("priority");
    expect(rowTitles()).toEqual(["Zapatillas", "Libro", "Lámpara", "Audífonos"]);
  });

  it("re-orders the list when another sort is chosen", () => {
    renderScreen();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "name-asc" } });

    expect(rowTitles()).toEqual(["Lámpara", "Libro", "Zapatillas", "Audífonos"]);
  });

  it("moves an item to the end once it is checked as owned", () => {
    renderScreen();

    fireEvent.click(screen.getByRole("checkbox", { name: "Zapatillas" }));

    expect(rowTitles()).toEqual(["Libro", "Lámpara", "Audífonos", "Zapatillas"]);
  });

  // Visitors could always mark an item as owned (the card's toggle had no owner
  // gate); only editing and deleting are owner-only.
  it("lets a visitor check items but not edit or delete them", () => {
    renderScreen(false);

    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect((checkbox as HTMLInputElement).disabled).toBe(false);
    }
    expect(screen.queryByLabelText("Eliminar Zapatillas")).toBeNull();
  });
});
