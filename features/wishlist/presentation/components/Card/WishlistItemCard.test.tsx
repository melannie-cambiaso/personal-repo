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
  emoji: "🎁",
  category: CATEGORIES.tech,
  price: 1000,
};

describe("WishlistItemCard", () => {
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
