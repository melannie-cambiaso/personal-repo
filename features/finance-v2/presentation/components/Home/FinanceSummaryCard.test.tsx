import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FinanceSummaryCard } from "./FinanceSummaryCard";
import { formatMonth } from "@/shared/utils/formatMonth";

describe("FinanceSummaryCard", () => {
  it("shows the month header, the month's balance and what is pending", () => {
    render(<FinanceSummaryCard month="2026-10" balance={500_000} pending={300_000} />);

    expect(screen.getByText(`Finanzas · ${formatMonth("2026-10")}`)).toBeTruthy();
    expect(screen.getByText("Balance del mes").nextSibling?.textContent).toBe("$500.000");
    expect(screen.getByText("Pendiente por pagar").nextSibling?.textContent).toBe("$300.000");
  });

  it("shows the surplus in green when the balance covers what is pending", () => {
    render(<FinanceSummaryCard month="2026-10" balance={500_000} pending={300_000} />);

    const diff = screen.getByText("Te sobran $200.000");
    expect(diff.className).toContain("text-green-700");
    expect(screen.queryByText(/Te faltan/)).toBeNull();
  });

  it("shows the shortfall in red when the balance does not cover what is pending", () => {
    render(<FinanceSummaryCard month="2026-10" balance={350_000} pending={500_000} />);

    const diff = screen.getByText("Te faltan $150.000");
    expect(diff.className).toContain("text-red-600");
    expect(screen.queryByText(/Te sobran/)).toBeNull();
  });

  // A balance that exactly covers what is pending is not a shortfall.
  it("reads as a $0 surplus when the balance exactly covers what is pending", () => {
    render(<FinanceSummaryCard month="2026-10" balance={200_000} pending={200_000} />);

    expect(screen.getByText("Te sobran $0")).toBeTruthy();
    expect(screen.queryByText(/Te faltan/)).toBeNull();
  });

  it("links to the finance dashboard", () => {
    render(<FinanceSummaryCard month="2026-10" balance={0} pending={0} />);

    expect(screen.getByRole("link", { name: /Ver más/ }).getAttribute("href")).toBe("/finance-v2");
  });
});
