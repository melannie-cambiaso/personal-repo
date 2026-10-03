import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WishlistItemRow } from "./WishlistItemRow";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";
import { CATEGORIES } from "@/features/wishlist/data";

const item: WishlistItem = {
  id: "1",
  title: "Auriculares Sony",
  category: CATEGORIES.tech,
  price: 50000,
  priority: "high",
  url: "https://example.com/sony",
};

// A row saved before prices and priorities were required: no price, no priority.
const legacyItem: WishlistItem = {
  id: "2",
  title: "Zapatillas negras",
  category: CATEGORIES.cloth,
  price: null,
};

function renderOwnerRow(overrides: Partial<Parameters<typeof WishlistItemRow>[0]> = {}) {
  const handlers = { onToggle: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(<WishlistItemRow item={item} owned={false} {...handlers} {...overrides} />);
  return handlers;
}

describe("WishlistItemRow", () => {
  it("renders the title, the formatted price and the priority badge", () => {
    renderOwnerRow();

    expect(screen.getByText("Auriculares Sony")).toBeTruthy();
    expect(screen.getByText("$50.000")).toBeTruthy();
    expect(screen.getByText("Alta")).toBeTruthy();
  });

  it("flags a legacy item without a price as missing it, and reads it as medium priority", () => {
    renderOwnerRow({ item: legacyItem });

    const missing = screen.getByText("Falta precio");
    expect(missing.className).toContain("text-red-600");
    expect(screen.getByText("Media")).toBeTruthy();
  });

  describe("owned checkbox", () => {
    it("is labelled with the title and unchecked when not owned", () => {
      renderOwnerRow();

      const checkbox = screen.getByRole("checkbox", {
        name: "Auriculares Sony",
      }) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it("calls onToggle with the item id without opening the editor", () => {
      const { onToggle, onEdit } = renderOwnerRow();

      fireEvent.click(screen.getByRole("checkbox", { name: "Auriculares Sony" }));

      expect(onToggle).toHaveBeenCalledWith("1");
      expect(onEdit).not.toHaveBeenCalled();
    });

    it("is checked and strikes the title through when owned", () => {
      renderOwnerRow({ owned: true });

      const checkbox = screen.getByRole("checkbox", {
        name: "Auriculares Sony",
      }) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
      expect(screen.getByText("Auriculares Sony").className).toContain("line-through");
    });

    it("does not strike the title through when not owned", () => {
      renderOwnerRow();

      expect(screen.getByText("Auriculares Sony").className).not.toContain("line-through");
    });
  });

  describe("link", () => {
    it("opens the item url in a new tab without opening the editor", () => {
      const { onEdit } = renderOwnerRow();

      const link = screen.getByLabelText("Abrir link de Auriculares Sony");
      expect(link.getAttribute("href")).toBe("https://example.com/sony");
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");

      fireEvent.click(link);
      expect(onEdit).not.toHaveBeenCalled();
    });

    it("is not rendered when the item has no url", () => {
      renderOwnerRow({ item: legacyItem });

      expect(screen.queryByLabelText("Abrir link de Zapatillas negras")).toBeNull();
    });
  });

  it("calls onDelete with the item without opening the editor", () => {
    const { onDelete, onEdit } = renderOwnerRow();

    fireEvent.click(screen.getByLabelText("Eliminar Auriculares Sony"));

    expect(onDelete).toHaveBeenCalledWith(item);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("opens the editor when the owner taps the row", () => {
    const { onEdit } = renderOwnerRow();

    fireEvent.click(screen.getByText("Alta"));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(item);
  });

  it("exposes the editor to keyboard users through the title button", () => {
    const { onEdit } = renderOwnerRow();

    fireEvent.click(screen.getByRole("button", { name: "Auriculares Sony" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  describe("for a visitor", () => {
    it("shows no delete, no edit button and a disabled checkbox", () => {
      render(<WishlistItemRow item={item} owned={false} />);

      expect(screen.queryByLabelText("Eliminar Auriculares Sony")).toBeNull();
      expect(screen.queryByRole("button", { name: "Auriculares Sony" })).toBeNull();
      const checkbox = screen.getByRole("checkbox", {
        name: "Auriculares Sony",
      }) as HTMLInputElement;
      expect(checkbox.disabled).toBe(true);
    });

    it("still offers the link", () => {
      render(<WishlistItemRow item={item} owned={false} />);

      expect(screen.getByLabelText("Abrir link de Auriculares Sony")).toBeTruthy();
    });
  });
});
