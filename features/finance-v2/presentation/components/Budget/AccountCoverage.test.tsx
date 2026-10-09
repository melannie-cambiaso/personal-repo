import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountCoverage } from "./AccountCoverage";
import type { AccountCoverageView } from "./accountCoverageView";

const ready = (
  pending: number,
  balance: number,
  envelopeNote: AccountCoverageView["envelopeNote"] = null,
  pendingByCategory = pending
): AccountCoverageView => ({ figures: { pendingByCategory, pending, balance }, envelopeNote });

describe("AccountCoverage", () => {
  it("shows what is pending, the month's balance, and the surplus in green", () => {
    render(<AccountCoverage coverage={ready(300_000, 500_000)} />);

    expect(screen.getByText("Pendiente por subcategoría").nextSibling?.textContent).toBe(
      "$300.000"
    );
    expect(screen.getByText("Saldo del mes").nextSibling?.textContent).toBe("$500.000");
    const diff = screen.getByText("Te sobran $200.000");
    expect(diff.className).toContain("text-green-700");
  });

  // The category figure is display-only: the surplus/shortfall keeps subtracting the
  // subcategory figure.
  it("shows pending by category before pending by subcategory, diffing the latter", () => {
    render(<AccountCoverage coverage={ready(300_000, 500_000, null, 250_000)} />);

    const byCategory = screen.getByText("Pendiente por categoría");
    const bySubcategory = screen.getByText("Pendiente por subcategoría");
    expect(byCategory.nextSibling?.textContent).toBe("$250.000");
    expect(bySubcategory.nextSibling?.textContent).toBe("$300.000");
    expect(
      byCategory.compareDocumentPosition(bySubcategory) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.getByText("Te sobran $200.000")).toBeTruthy();
  });

  it("shows the shortfall in red when the balance does not cover what is pending", () => {
    render(<AccountCoverage coverage={ready(500_000, 350_000)} />);

    const diff = screen.getByText("Te faltan $150.000");
    expect(diff.className).toContain("text-red-600");
    expect(screen.queryByText(/Te sobran/)).toBeNull();
  });

  // A balance that exactly covers what is pending is not a shortfall.
  it("reads as a $0 surplus when the balance exactly covers what is pending", () => {
    render(<AccountCoverage coverage={ready(200_000, 200_000)} />);

    expect(screen.getByText("Te sobran $0")).toBeTruthy();
    expect(screen.queryByText(/Te faltan/)).toBeNull();
  });

  it("notes which category the envelope pays when one is configured", () => {
    render(
      <AccountCoverage
        coverage={ready(0, 0, { categoryName: "Cuentas", envelopeName: "Servicios" })}
      />
    );

    expect(screen.getByText("no incluye Cuentas: se paga desde Servicios")).toBeTruthy();
  });

  it("omits the envelope note when no envelope applies", () => {
    render(<AccountCoverage coverage={ready(0, 0)} />);

    expect(screen.queryByText(/no incluye/)).toBeNull();
  });

  it("renders — instead of any figure while the month is still loading, never a false $0", () => {
    render(<AccountCoverage coverage={{ figures: null, envelopeNote: null }} />);

    expect(screen.getAllByText("—")).toHaveLength(4);
    expect(screen.queryByText(/\$/)).toBeNull();
    expect(screen.queryByText(/Te sobran|Te faltan/)).toBeNull();
  });
});
