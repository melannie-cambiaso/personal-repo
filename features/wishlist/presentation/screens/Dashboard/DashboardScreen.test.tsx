import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DashboardScreen } from "./DashboardScreen";
import type { WishlistItem } from "@/features/wishlist/domain";
import { CATEGORIES } from "@/features/wishlist/data";

const items: WishlistItem[] = [
  { id: "low", title: "Lámpara", category: CATEGORIES.home, price: 10000, priority: "low" },
  { id: "legacy", title: "Libro", category: CATEGORIES.books, price: null },
  { id: "owned", title: "Audífonos", category: CATEGORIES.tech, price: 5000, priority: "high" },
  { id: "high", title: "Zapatillas", category: CATEGORIES.cloth, price: 30000, priority: "high" },
  { id: "high2", title: "Mochila", category: CATEGORIES.cloth, price: 20000, priority: "high" },
];

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

function renderScreen({ isOwner = true, initialItems = items } = {}) {
  const onAdd = vi.fn();
  render(
    <DashboardScreen
      initialItems={initialItems}
      initialOwnedIds={["owned"]}
      isOwner={isOwner}
      onAdd={onAdd}
      onToggle={vi.fn()}
    />
  );
  return { onAdd };
}

const rowTitles = () => screen.getAllByRole("checkbox").map((c) => c.getAttribute("aria-label"));
const headings = () => screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
const groupTitles = (heading: string) => {
  const list = screen.getByRole("heading", { level: 2, name: heading }).nextElementSibling;
  return within(list as HTMLElement)
    .getAllByRole("checkbox")
    .map((c) => c.getAttribute("aria-label"));
};

describe("DashboardScreen", () => {
  it("groups items under priority headings in stored order, with owned items last", () => {
    renderScreen();

    expect(headings()).toEqual(["Alta", "Media", "Baja", "Comprados"]);
    expect(groupTitles("Alta")).toEqual(["Zapatillas", "Mochila"]);
    expect(groupTitles("Media")).toEqual(["Libro"]);
    expect(groupTitles("Baja")).toEqual(["Lámpara"]);
    expect(groupTitles("Comprados")).toEqual(["Audífonos"]);
    expect(rowTitles()).toEqual(["Zapatillas", "Mochila", "Libro", "Lámpara", "Audífonos"]);
  });

  it("only shows headings for non-empty groups", () => {
    renderScreen({ initialItems: items.filter((i) => i.id !== "low" && i.id !== "owned") });

    expect(headings()).toEqual(["Alta", "Media"]);
  });

  it("has no sort select", () => {
    renderScreen();

    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("moves an item down within its group and persists the new order", () => {
    const { onAdd } = renderScreen();

    fireEvent.click(screen.getByRole("button", { name: "Bajar Zapatillas" }));

    expect(groupTitles("Alta")).toEqual(["Mochila", "Zapatillas"]);
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0].map((i: WishlistItem) => i.id)).toEqual([
      "low",
      "legacy",
      "owned",
      "high2",
      "high",
    ]);
  });

  it("disables moving past the edges of a group", () => {
    renderScreen();

    const up = screen.getByRole("button", { name: "Subir Zapatillas" }) as HTMLButtonElement;
    const down = screen.getByRole("button", { name: "Bajar Mochila" }) as HTMLButtonElement;
    expect(up.disabled).toBe(true);
    expect(down.disabled).toBe(true);
  });

  it("shows no move buttons on owned items", () => {
    renderScreen();

    expect(screen.queryByRole("button", { name: "Subir Audífonos" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Bajar Audífonos" })).toBeNull();
  });

  it("moves an item under Comprados once it is checked as owned", () => {
    renderScreen();

    fireEvent.click(screen.getByRole("checkbox", { name: "Zapatillas" }));

    expect(groupTitles("Alta")).toEqual(["Mochila"]);
    expect(groupTitles("Comprados")).toEqual(["Audífonos", "Zapatillas"]);
    expect(screen.queryByRole("button", { name: "Bajar Zapatillas" })).toBeNull();
  });

  // Visitors could always mark an item as owned (the card's toggle had no owner
  // gate); only editing, deleting and reordering are owner-only.
  it("lets a visitor check items but not edit, delete or reorder them", () => {
    renderScreen({ isOwner: false });

    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect((checkbox as HTMLInputElement).disabled).toBe(false);
    }
    expect(screen.queryByLabelText("Eliminar Zapatillas")).toBeNull();
    expect(screen.queryByRole("button", { name: /^(Subir|Bajar) / })).toBeNull();
  });
});
