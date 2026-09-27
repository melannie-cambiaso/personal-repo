import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WishlistItemCard } from "./WishlistItemCard";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";
import { CATEGORIES } from "@/features/wishlist/data";

const item: WishlistItem = {
  id: "1",
  title: "Test Item",
  brand: "Brand",
  description: "Desc",
  // Deliberately NOT the placeholder glyph: sharing it would make the fallback
  // test unable to tell a rendered fallback from a rendered item emoji.
  emoji: "🎧",
  category: CATEGORIES.tech,
  price: 1000,
};

// What the quick-add path produces: a title, a category, and nothing else.
const sparseItem: WishlistItem = {
  id: "2",
  title: "Zapatillas negras",
  category: CATEGORIES.cloth,
  price: null,
};

describe("WishlistItemCard", () => {
  // The card used to assume every field existed, so an item captured in one field
  // would paint an empty uppercase brand line and a blank gap where the
  // description goes. Absent means absent: the element is not rendered at all.
  describe("an item saved with only a title", () => {
    it("renders its title and category without the missing fields", () => {
      render(<WishlistItemCard {...sparseItem} owned={false} onToggle={vi.fn()} />);

      expect(screen.getByText("Zapatillas negras")).toBeTruthy();
      expect(screen.getByText(CATEGORIES.cloth.name)).toBeTruthy();
      expect(screen.queryByTestId("item-brand")).toBeNull();
      expect(screen.queryByTestId("item-description")).toBeNull();
    });

    // The image area is a fixed-height block: with neither image nor emoji it would
    // otherwise be a blank rectangle at the top of every quick-captured card.
    it("falls back to a placeholder emoji when it has no image and no emoji", () => {
      render(<WishlistItemCard {...sparseItem} owned={false} onToggle={vi.fn()} />);

      expect(screen.getByText("\u{1F381}")).toBeTruthy();
    });

    it("still offers the toggle, so it can be marked as owned like any other", () => {
      const onToggle = vi.fn();
      render(<WishlistItemCard {...sparseItem} owned={false} onToggle={onToggle} />);

      fireEvent.click(screen.getByText("Lo tengo ✓"));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  it("renders brand and description when the item carries them", () => {
    render(<WishlistItemCard {...item} owned={false} onToggle={vi.fn()} />);

    expect(screen.getByTestId("item-brand").textContent).toBe("Brand");
    expect(screen.getByTestId("item-description").textContent).toBe("Desc");
    expect(screen.getByText("\u{1F3A7}")).toBeTruthy();
    expect(screen.queryByText("\u{1F381}")).toBeNull();
  });

  it("does not render trash button when onDelete is undefined", () => {
    render(<WishlistItemCard {...item} owned={false} onToggle={vi.fn()} />);
    expect(screen.queryByLabelText("Delete item")).toBeNull();
  });

  it("renders trash button when onDelete is defined", () => {
    render(<WishlistItemCard {...item} owned={false} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByLabelText("Delete item")).toBeTruthy();
  });

  it("clicking trash calls onDelete and not onEdit", () => {
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    render(
      <WishlistItemCard
        {...item}
        owned={false}
        onToggle={vi.fn()}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    );
    fireEvent.click(screen.getByLabelText("Delete item"));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
  });
});
