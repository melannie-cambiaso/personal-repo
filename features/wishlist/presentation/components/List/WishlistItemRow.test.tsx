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
  // The list's group headings carry the priority, so the row has no badge.
  it("renders the title and the formatted price, without a priority badge", () => {
    renderOwnerRow();

    expect(screen.getByText("Auriculares Sony")).toBeTruthy();
    expect(screen.getByText("$50.000")).toBeTruthy();
    expect(screen.queryByText("Alta")).toBeNull();
  });

  it("flags a legacy item without a price as missing it", () => {
    renderOwnerRow({ item: legacyItem });

    const missing = screen.getByText("Falta precio");
    expect(missing.className).toContain("text-red-600");
    expect(screen.queryByText("Media")).toBeNull();
  });

  describe("move buttons", () => {
    function renderMovableRow(canMoveUp = true, canMoveDown = true) {
      const onMoveUp = vi.fn();
      const onMoveDown = vi.fn();
      const handlers = renderOwnerRow({ onMoveUp, onMoveDown, canMoveUp, canMoveDown });
      return { ...handlers, onMoveUp, onMoveDown };
    }

    it("are labelled with the title", () => {
      renderMovableRow();

      expect(screen.getByRole("button", { name: "Subir Auriculares Sony" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Bajar Auriculares Sony" })).toBeTruthy();
    });

    it("call their handler with the item id without opening the editor", () => {
      const { onMoveUp, onMoveDown, onEdit } = renderMovableRow();

      fireEvent.click(screen.getByRole("button", { name: "Subir Auriculares Sony" }));
      fireEvent.click(screen.getByRole("button", { name: "Bajar Auriculares Sony" }));

      expect(onMoveUp).toHaveBeenCalledWith("1");
      expect(onMoveDown).toHaveBeenCalledWith("1");
      expect(onEdit).not.toHaveBeenCalled();
    });

    it("are disabled at the edges of the group", () => {
      renderMovableRow(false, false);

      const up = screen.getByRole("button", { name: "Subir Auriculares Sony" });
      const down = screen.getByRole("button", { name: "Bajar Auriculares Sony" });
      expect((up as HTMLButtonElement).disabled).toBe(true);
      expect((down as HTMLButtonElement).disabled).toBe(true);
    });

    it("disable only the direction that cannot move", () => {
      renderMovableRow(false, true);

      const up = screen.getByRole("button", { name: "Subir Auriculares Sony" });
      const down = screen.getByRole("button", { name: "Bajar Auriculares Sony" });
      expect((up as HTMLButtonElement).disabled).toBe(true);
      expect((down as HTMLButtonElement).disabled).toBe(false);
    });

    it("are not rendered without move handlers", () => {
      renderOwnerRow();

      expect(screen.queryByRole("button", { name: "Subir Auriculares Sony" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Bajar Auriculares Sony" })).toBeNull();
    });
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

    fireEvent.click(screen.getByText("$50.000"));

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
