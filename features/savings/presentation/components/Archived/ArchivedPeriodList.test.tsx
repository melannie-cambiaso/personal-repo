import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArchivedPeriodList } from "./ArchivedPeriodList";
import type { SavingsPeriod } from "@/features/savings/domain/SavingsPeriod";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";

const makePeriod = (overrides: Partial<SavingsPeriod> = {}): SavingsPeriod => ({
  id: "p1",
  startedAt: "2026-01-01T00:00:00Z",
  closedAt: "2026-02-01T00:00:00Z",
  initialAmount: 0,
  ...overrides,
});

const makeEntry = (overrides: Partial<SavingsEntry> = {}): SavingsEntry => ({
  id: "e1",
  type: "deposito",
  amount: 100,
  date: "2026-01-15",
  toReplenish: false,
  createdAt: "2026-01-15T00:00:00Z",
  periodId: "p1",
  ...overrides,
});

describe("ArchivedPeriodList", () => {
  it("shows an empty state when there are no archived periods", () => {
    render(<ArchivedPeriodList periods={[]} entries={[]} />);
    expect(screen.getByText(/todav.a no archivaste/i)).toBeTruthy();
  });

  it("lists only closed periods, most recent first, using label or date range", () => {
    const periods = [
      makePeriod({ id: "p1", closedAt: "2026-02-01T00:00:00Z" }),
      makePeriod({ id: "p2", closedAt: "2026-03-01T00:00:00Z", label: "Marzo" }),
      makePeriod({ id: "p3", closedAt: undefined }),
    ];
    render(<ArchivedPeriodList periods={periods} entries={[]} />);
    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toHaveLength(2);
    expect(headings[0]).toBe("Marzo");
    expect(headings[1]).toContain("/");
  });

  it("shows the per-period A reponer total only when there are pending gastos", () => {
    const periods = [makePeriod({ id: "p1" })];
    const entries = [
      makeEntry({ id: "e1", periodId: "p1", type: "gasto", amount: 500, toReplenish: true }),
    ];
    render(<ArchivedPeriodList periods={periods} entries={entries} />);
    expect(screen.getByText(/pendiente de reponer/i)).toBeTruthy();
  });

  it("does not show the pending-to-replenish badge when nothing is pending", () => {
    const periods = [makePeriod({ id: "p1" })];
    const entries = [makeEntry({ id: "e1", periodId: "p1", type: "deposito", amount: 500 })];
    render(<ArchivedPeriodList periods={periods} entries={entries} />);
    expect(screen.queryByText(/pendiente de reponer/i)).toBeNull();
  });

  it("renders each period's entries read-only, with no edit or delete affordances", () => {
    const periods = [makePeriod({ id: "p1" })];
    const entries = [makeEntry({ id: "e1", periodId: "p1", type: "deposito", amount: 500 })];
    render(<ArchivedPeriodList periods={periods} entries={entries} />);
    expect(screen.getByText("+$500")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
  });
});
