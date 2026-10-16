import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppNav } from "./AppNav";

const { usePathname, useSearchParams } = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname,
  useSearchParams,
}));

beforeEach(() => {
  usePathname.mockReturnValue("/");
  useSearchParams.mockReturnValue(new URLSearchParams());
});

const trigger = () => screen.getByRole("button", { name: "Abrir menú" });
const link = (name: RegExp) => screen.getByRole("link", { name });

describe("AppNav", () => {
  it("renders a labelled navigation landmark", () => {
    render(<AppNav />);
    expect(screen.getByRole("navigation", { name: "Principal" })).toBeTruthy();
  });

  it("shows the app name", () => {
    render(<AppNav />);
    expect(screen.getAllByText("Personal Repo").length).toBeGreaterThan(0);
  });

  it("links home first, then every feature", () => {
    render(<AppNav />);
    expect(link(/inicio/i).getAttribute("href")).toBe("/");
    expect(link(/finanzas v2/i).getAttribute("href")).toBe("/finance-v2");
    expect(link(/casa/i).getAttribute("href")).toBe("/home-improvements");
    expect(link(/ahorros/i).getAttribute("href")).toBe("/savings");
    expect(link(/wishlist/i).getAttribute("href")).toBe("/wishlist");
  });

  it("highlights the active link for the current feature route", () => {
    usePathname.mockReturnValue("/savings");
    render(<AppNav />);
    expect(link(/ahorros/i).getAttribute("aria-current")).toBe("page");
    expect(link(/wishlist/i).getAttribute("aria-current")).toBeNull();
    expect(link(/inicio/i).getAttribute("aria-current")).toBeNull();
  });

  it("highlights only Inicio on the home route", () => {
    render(<AppNav />);
    const current = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(current).toEqual([link(/inicio/i)]);
  });

  it("renders nothing on the login route", () => {
    usePathname.mockReturnValue("/login");
    const { container } = render(<AppNav />);
    expect(container.innerHTML).toBe("");
  });

  describe("mobile drawer", () => {
    it("starts closed", () => {
      render(<AppNav />);
      expect(trigger().getAttribute("aria-expanded")).toBe("false");
      expect(screen.queryByRole("button", { name: "Cerrar menú" })).toBeNull();
    });

    it("opens from the trigger", () => {
      render(<AppNav />);
      fireEvent.click(trigger());
      expect(trigger().getAttribute("aria-expanded")).toBe("true");
    });

    it("closes on backdrop click", () => {
      render(<AppNav />);
      fireEvent.click(trigger());
      fireEvent.click(screen.getByRole("button", { name: "Cerrar menú" }));
      expect(trigger().getAttribute("aria-expanded")).toBe("false");
    });

    it("closes on Escape", () => {
      render(<AppNav />);
      fireEvent.click(trigger());
      fireEvent.keyDown(document, { key: "Escape" });
      expect(trigger().getAttribute("aria-expanded")).toBe("false");
    });

    it("closes when the pathname changes", () => {
      const { rerender } = render(<AppNav />);
      fireEvent.click(trigger());
      usePathname.mockReturnValue("/wishlist");
      rerender(<AppNav />);
      expect(trigger().getAttribute("aria-expanded")).toBe("false");
    });
  });

  describe("feature sections (sub-levels)", () => {
    it("lists the Finanzas v2 sections as links carrying the section param", () => {
      render(<AppNav />);
      expect(link(/presupuesto/i).getAttribute("href")).toBe("/finance-v2?section=budget");
      expect(link(/movimientos/i).getAttribute("href")).toBe("/finance-v2?section=movements");
      expect(link(/análisis/i).getAttribute("href")).toBe("/finance-v2?section=analysis");
    });

    it("groups the sections under their feature", () => {
      render(<AppNav />);
      const group = screen.getByRole("list", { name: /finanzas v2/i });
      expect(group.contains(link(/movimientos/i))).toBe(true);
    });

    it("marks the first section active when on the feature route without a param", () => {
      usePathname.mockReturnValue("/finance-v2");
      render(<AppNav />);
      expect(link(/presupuesto/i).getAttribute("aria-current")).toBe("page");
      expect(link(/movimientos/i).getAttribute("aria-current")).toBeNull();
    });

    it("marks the section named by the param active", () => {
      usePathname.mockReturnValue("/finance-v2");
      useSearchParams.mockReturnValue(new URLSearchParams("section=analysis"));
      render(<AppNav />);
      expect(link(/análisis/i).getAttribute("aria-current")).toBe("page");
      expect(link(/presupuesto/i).getAttribute("aria-current")).toBeNull();
    });

    it("marks no section active on another route", () => {
      usePathname.mockReturnValue("/savings");
      render(<AppNav />);
      expect(link(/presupuesto/i).getAttribute("aria-current")).toBeNull();
    });

    it("switches section on the same route via pushState and closes the drawer", () => {
      usePathname.mockReturnValue("/finance-v2");
      const pushState = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
      render(<AppNav />);
      fireEvent.click(trigger());
      fireEvent.click(link(/movimientos/i));
      expect(pushState).toHaveBeenCalledWith(null, "", "/finance-v2?section=movements");
      expect(trigger().getAttribute("aria-expanded")).toBe("false");
      pushState.mockRestore();
    });
  });
});
