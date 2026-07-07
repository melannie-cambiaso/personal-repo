import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppNav } from "./AppNav";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname,
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

beforeEach(() => {
  usePathname.mockReturnValue("/");
});

describe("AppNav", () => {
  it("renders the trigger closed with aria-expanded false", () => {
    render(<AppNav />);
    const trigger = screen.getByRole("button", { name: /menú/i });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens the drawer and calls showModal when the trigger is activated", () => {
    render(<AppNav />);
    const trigger = screen.getByRole("button", { name: /menú/i });
    fireEvent.click(trigger);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("lists all 6 feature links inside the drawer", () => {
    render(<AppNav />);
    fireEvent.click(screen.getByRole("button", { name: /menú/i }));
    expect(
      screen.getByRole("link", { name: /wishlist/i, hidden: true }).getAttribute("href")
    ).toBe("/wishlist");
    expect(
      screen.getByRole("link", { name: /to-do/i, hidden: true }).getAttribute("href")
    ).toBe("/todo");
    expect(
      screen.getByRole("link", { name: /casa/i, hidden: true }).getAttribute("href")
    ).toBe("/home-improvements");
    expect(
      screen.getByRole("link", { name: /ahorros/i, hidden: true }).getAttribute("href")
    ).toBe("/savings");
    expect(
      screen.getByRole("link", { name: /finanzas/i, hidden: true }).getAttribute("href")
    ).toBe("/finance");
    expect(
      screen.getByRole("link", { name: /compras/i, hidden: true }).getAttribute("href")
    ).toBe("/shopping-list");
  });

  it("highlights the active link for the current feature route", () => {
    usePathname.mockReturnValue("/todo");
    render(<AppNav />);
    fireEvent.click(screen.getByRole("button", { name: /menú/i }));
    const todoLink = screen.getByRole("link", { name: /to-do/i, hidden: true });
    const wishlistLink = screen.getByRole("link", { name: /wishlist/i, hidden: true });
    expect(todoLink.getAttribute("aria-current")).toBe("page");
    expect(wishlistLink.getAttribute("aria-current")).toBeNull();
  });

  it("has no active link when on the home route", () => {
    usePathname.mockReturnValue("/");
    render(<AppNav />);
    fireEvent.click(screen.getByRole("button", { name: /menú/i }));
    const links = screen.getAllByRole("link", { hidden: true });
    expect(links).toHaveLength(6);
    for (const link of links) {
      expect(link.getAttribute("aria-current")).toBeNull();
    }
  });

  it("closes the drawer when the close button is activated", () => {
    render(<AppNav />);
    fireEvent.click(screen.getByRole("button", { name: /menú/i }));
    fireEvent.click(screen.getByRole("button", { name: /cerrar/i, hidden: true }));
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /menú/i }).getAttribute("aria-expanded")
    ).toBe("false");
  });

  it("closes the drawer when the pathname changes", () => {
    usePathname.mockReturnValue("/");
    const { rerender } = render(<AppNav />);
    fireEvent.click(screen.getByRole("button", { name: /menú/i }));
    expect(
      screen.getByRole("button", { name: /menú/i }).getAttribute("aria-expanded")
    ).toBe("true");

    usePathname.mockReturnValue("/wishlist");
    rerender(<AppNav />);

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /menú/i }).getAttribute("aria-expanded")
    ).toBe("false");
  });
});
