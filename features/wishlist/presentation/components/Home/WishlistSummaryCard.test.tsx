import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WishlistSummaryCard } from "./WishlistSummaryCard";
import type { WishlistItem } from "@/features/wishlist/domain";
import { CATEGORIES } from "@/features/wishlist/data";

const headphones: WishlistItem = {
  id: "1",
  title: "Auriculares Sony",
  category: CATEGORIES.tech,
  price: 50000,
  priority: "high",
  url: "https://example.com/sony",
};

// A legacy row saved before prices were required.
const sneakers: WishlistItem = {
  id: "2",
  title: "Zapatillas negras",
  category: CATEGORIES.cloth,
  price: null,
  priority: "high",
};

describe("WishlistSummaryCard", () => {
  it("shows the header, how many items are pending and their approximate total", () => {
    render(<WishlistSummaryCard pendingCount={7} total={250_000} topHigh={[]} />);

    expect(screen.getByText("Wishlist")).toBeTruthy();
    expect(screen.getByText("Pendientes").nextSibling?.textContent).toBe("7");
    expect(screen.getByText("Total aprox.").nextSibling?.textContent).toBe("$250.000");
  });

  it("lists the top high-priority items with their price", () => {
    render(
      <WishlistSummaryCard pendingCount={2} total={50_000} topHigh={[headphones, sneakers]} />
    );

    expect(screen.getByText("Prioridad alta")).toBeTruthy();
    expect(screen.getByText("Auriculares Sony").nextSibling?.textContent).toBe("$50.000");
    expect(screen.queryByText("Nada con prioridad alta")).toBeNull();
  });

  it("flags a high-priority item with no price in red", () => {
    render(<WishlistSummaryCard pendingCount={1} total={0} topHigh={[sneakers]} />);

    const missing = screen.getByText("Zapatillas negras").nextSibling as HTMLElement;
    expect(missing.textContent).toBe("Falta precio");
    expect(missing.className).toContain("text-red-600");
  });

  it("says so when nothing pending has high priority", () => {
    render(<WishlistSummaryCard pendingCount={3} total={90_000} topHigh={[]} />);

    expect(screen.getByText("Nada con prioridad alta")).toBeTruthy();
  });

  it("links to the wishlist", () => {
    render(<WishlistSummaryCard pendingCount={0} total={0} topHigh={[]} />);

    expect(screen.getByRole("link", { name: /Ver más/ }).getAttribute("href")).toBe("/wishlist");
  });
});
