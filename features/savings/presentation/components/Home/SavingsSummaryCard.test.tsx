import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SavingsSummaryCard } from "./SavingsSummaryCard";

describe("SavingsSummaryCard", () => {
  it("shows the header, the active period balance and the amount to replenish", () => {
    render(<SavingsSummaryCard balance={120_000} toReplenish={15_000} />);

    expect(screen.getByText("Ahorros")).toBeTruthy();
    expect(screen.getByText("Balance").nextSibling?.textContent).toBe("$120.000");
    expect(screen.getByText("A reponer").nextSibling?.textContent).toBe("$15.000");
  });

  it("colors a positive balance green", () => {
    render(<SavingsSummaryCard balance={1} toReplenish={0} />);

    const value = screen.getByText("Balance").nextSibling as HTMLElement;
    expect(value.className).toContain("text-green-700");
  });

  it("colors a negative balance red", () => {
    render(<SavingsSummaryCard balance={-5_000} toReplenish={0} />);

    const value = screen.getByText("Balance").nextSibling as HTMLElement;
    expect(value.className).toContain("text-red-600");
  });

  it("keeps a zero balance neutral", () => {
    render(<SavingsSummaryCard balance={0} toReplenish={0} />);

    const value = screen.getByText("Balance").nextSibling as HTMLElement;
    expect(value.className).toContain("text-brown-600");
  });

  it("links to savings", () => {
    render(<SavingsSummaryCard balance={0} toReplenish={0} />);

    expect(screen.getByRole("link", { name: /Ver más/ }).getAttribute("href")).toBe("/savings");
  });
});
