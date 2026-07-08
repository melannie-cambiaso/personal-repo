import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MonthlyBreakdown } from "./MonthlyBreakdown";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";

const entry = (overrides: Partial<SavingsEntry>): SavingsEntry => ({
  id: "1",
  type: "deposito",
  amount: 100,
  date: "2026-06-01",
  toReplenish: false,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("MonthlyBreakdown", () => {
  it("renders one card per month, newest first", () => {
    const entries = [
      entry({ id: "1", date: "2026-06-05", type: "deposito", amount: 50000 }),
      entry({ id: "2", date: "2026-07-05", type: "deposito", amount: 20000 }),
    ];

    render(<MonthlyBreakdown entries={entries} />);

    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(2);
    expect(headings[0].textContent).toMatch(/julio/i);
    expect(headings[1].textContent).toMatch(/junio/i);
  });

  it("shows Depositado/Gastado/Neto totals formatted via formatCLP", () => {
    const entries = [
      entry({ id: "1", date: "2026-06-05", type: "deposito", amount: 100000 }),
      entry({ id: "2", date: "2026-06-10", type: "gasto", amount: 30000 }),
    ];

    render(<MonthlyBreakdown entries={entries} />);

    expect(screen.getByText("Depositado")).toBeTruthy();
    expect(screen.getByText("Gastado")).toBeTruthy();
    expect(screen.getByText("Neto")).toBeTruthy();
    expect(screen.getByText("$100.000")).toBeTruthy();
    expect(screen.getByText("$30.000")).toBeTruthy();
    expect(screen.getByText("$70.000")).toBeTruthy();
  });

  it("renders a 'Sin registros' placeholder for empty entries without crashing", () => {
    render(<MonthlyBreakdown entries={[]} />);

    expect(screen.getByText(/sin registros/i)).toBeTruthy();
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
  });
});
