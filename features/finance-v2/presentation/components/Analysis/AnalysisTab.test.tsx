import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AnalysisTab } from "./AnalysisTab";
import type { MonthAnalysis } from "@/features/finance-v2/domain";
import { formatMonth } from "@/shared/utils/formatMonth";

// A month that overran: one weekly leaf over, one monthly leaf exactly on budget,
// one monthly leaf under. Deviations arrive already sorted worst-first — the tab
// renders `computeMonthAnalysis`'s order and never re-sorts.
const analysis: MonthAnalysis = {
  summary: {
    month: "2026-09",
    budgeted: 500_000,
    spent: 540_000,
    difference: -40_000,
    unassigned: 12_000,
  },
  deviations: [
    {
      id: "s1",
      name: "Comida",
      parentName: "Hogar",
      bucket: "variable",
      frequency: "weekly",
      budgeted: 80_000,
      spent: 95_000,
      deviation: 15_000,
      perWeek: { budgeted: 20_000, spentAvg: 23_750, weeks: 4 },
    },
    {
      id: "c1",
      name: "Arriendo",
      bucket: "fixed",
      frequency: "monthly",
      budgeted: 350_000,
      spent: 350_000,
      deviation: 0,
      perWeek: null,
    },
    {
      id: "c2",
      name: "Transporte",
      bucket: "variable",
      frequency: "monthly",
      budgeted: 70_000,
      spent: 62_000,
      deviation: -8_000,
      perWeek: null,
    },
  ],
  nextMonth: {
    month: "2026-10",
    budgeted: 520_000,
    overruns: [
      {
        id: "s1",
        name: "Comida",
        parentName: "Hogar",
        weeks: 5,
        budgeted: 100_000,
        projectedSpend: 118_750,
        projectedOverrun: 18_750,
      },
    ],
  },
};

afterEach(cleanup);

describe("AnalysisTab", () => {
  describe("month summary", () => {
    it("shows the week-adjusted budget, the actual spend and the difference", () => {
      render(<AnalysisTab analysis={analysis} />);

      expect(screen.getByText("Presupuestado").nextSibling?.textContent).toBe("$500.000");
      expect(screen.getByText("Gastado").nextSibling?.textContent).toBe("$540.000");
      expect(screen.getByText("Diferencia").nextSibling?.textContent).toBe("-$40.000");
    });

    // `spent` already contains `unassigned`, so `difference` nets it too. Pinned
    // because the tab must never re-subtract it: 500.000 - 540.000 is -40.000, not
    // -52.000, and the uncategorized 12.000 is part of that 540.000.
    it("nets unassigned spend into the difference exactly once", () => {
      render(<AnalysisTab analysis={analysis} />);

      expect(screen.getByText("Diferencia").nextSibling?.textContent).toBe("-$40.000");
      expect(screen.getByText("incluye sin categoría: $12.000")).toBeTruthy();
    });

    it("shows a positive difference when the month came in under budget", () => {
      const underBudget: MonthAnalysis = {
        ...analysis,
        summary: { ...analysis.summary, spent: 460_000, difference: 40_000 },
      };
      render(<AnalysisTab analysis={underBudget} />);

      expect(screen.getByText("Diferencia").nextSibling?.textContent).toBe("+$40.000");
    });

    // Unassigned spend is already inside `spent`, so without it on screen the
    // per-leaf rows silently fail to add up to the total. It reads as "incluye"
    // precisely because a bare "sin categoría: $12.000" left it ambiguous whether
    // the figure was already counted in `Gastado` or still had to be added to it.
    it("discloses unassigned spend as part of the total, only when there is some", () => {
      render(<AnalysisTab analysis={analysis} />);
      expect(screen.getByText("incluye sin categoría: $12.000")).toBeTruthy();
      cleanup();

      render(
        <AnalysisTab
          analysis={{ ...analysis, summary: { ...analysis.summary, unassigned: 0 } }}
        />
      );
      expect(screen.queryByText(/sin categoría/)).toBeNull();
    });
  });

  describe("per-leaf deviations", () => {
    it("renders every leaf in the order given, worst overrun first", () => {
      render(<AnalysisTab analysis={analysis} />);

      const names = screen.getAllByTestId("deviation-name").map((n) => n.textContent);
      expect(names).toEqual(["Hogar · Comida", "Arriendo", "Transporte"]);
    });

    it("signs each deviation so an overrun reads apart from a saving", () => {
      render(<AnalysisTab analysis={analysis} />);

      const deviations = screen.getAllByTestId("deviation-amount").map((n) => n.textContent);
      expect(deviations).toEqual(["+$15.000", "$0", "-$8.000"]);
    });

    it("pairs spend against budget for every leaf", () => {
      render(<AnalysisTab analysis={analysis} />);

      expect(screen.getByText("$95.000 de $80.000")).toBeTruthy();
      expect(screen.getByText("$62.000 de $70.000")).toBeTruthy();
    });

    // A monthly leaf gets no per-week line: dividing a monthly commitment by
    // weeks is a meaningless figure (see `LeafDeviation.perWeek`).
    it("adds a per-week reading for a weekly leaf only", () => {
      render(<AnalysisTab analysis={analysis} />);

      expect(screen.getByText("por semana: $23.750 de $20.000 · 4 semanas")).toBeTruthy();
      expect(screen.getAllByText(/por semana:/)).toHaveLength(1);
    });

    it("explains an empty deviation list instead of rendering nothing", () => {
      render(
        <AnalysisTab
          analysis={{
            ...analysis,
            deviations: [],
            summary: { ...analysis.summary, budgeted: 0, spent: 0, difference: 0, unassigned: 0 },
          }}
        />
      );

      expect(screen.getByText("No hay categorías con presupuesto ni gasto en el mes")).toBeTruthy();
      expect(screen.queryByTestId("deviation-name")).toBeNull();
    });
  });

  describe("next month projection", () => {
    it("names next month and shows its projected budget", () => {
      render(<AnalysisTab analysis={analysis} />);

      expect(screen.getByText(formatMonth("2026-10"), { exact: false })).toBeTruthy();
      expect(screen.getByText("Presupuesto proyectado").nextSibling?.textContent).toBe("$520.000");
    });

    it("shows how much to cut from each leaf that overran, at the current pace", () => {
      render(<AnalysisTab analysis={analysis} />);

      expect(screen.getByText("al ritmo actual: $118.750 de $100.000 · 5 semanas")).toBeTruthy();
      expect(screen.getByText("recortar $18.750")).toBeTruthy();
    });

    it("omits the weeks note for a monthly leaf, whose pace no week count rescales", () => {
      render(
        <AnalysisTab
          analysis={{
            ...analysis,
            nextMonth: {
              ...analysis.nextMonth,
              overruns: [
                {
                  id: "c3",
                  name: "Delivery",
                  weeks: null,
                  budgeted: 40_000,
                  projectedSpend: 55_000,
                  projectedOverrun: 15_000,
                },
              ],
            },
          }}
        />
      );

      // Asserted as the pace line's WHOLE text: a bare `/semanas/` query would
      // match the weekly leaf's per-week line over in the deviations block.
      expect(screen.getByText(/al ritmo actual/).textContent).toBe(
        "al ritmo actual: $55.000 de $40.000"
      );
    });

    // `projectedOverrun` is signed and can land at or below zero: a weekly leaf
    // that overran a 5-week month can fit inside a 4-week one untouched. Asking to
    // "recortar $-4.000" would be worse than saying nothing.
    it("asks for no cut when a shorter next month absorbs the overrun on its own", () => {
      render(
        <AnalysisTab
          analysis={{
            ...analysis,
            nextMonth: {
              ...analysis.nextMonth,
              overruns: [
                {
                  id: "s1",
                  name: "Comida",
                  parentName: "Hogar",
                  weeks: 4,
                  budgeted: 80_000,
                  projectedSpend: 76_000,
                  projectedOverrun: -4_000,
                },
              ],
            },
          }}
        />
      );

      expect(screen.getByText("sin recorte necesario")).toBeTruthy();
      expect(screen.queryByText(/recortar/)).toBeNull();
    });

    it("says so when nothing overran instead of showing an empty block", () => {
      render(
        <AnalysisTab
          analysis={{ ...analysis, nextMonth: { ...analysis.nextMonth, overruns: [] } }}
        />
      );

      expect(screen.getByText("Ninguna categoría se pasó del presupuesto")).toBeTruthy();
    });
  });

  // Analyzing a not-yet-loaded month would read as a month with zero spend, i.e.
  // every category fully under budget — the opposite of the truth.
  it("shows a loading state instead of analyzing a month whose transactions are pending", () => {
    render(<AnalysisTab analysis={null} />);

    expect(screen.getByText("Cargando el análisis del mes…")).toBeTruthy();
    expect(screen.queryByText("Presupuestado")).toBeNull();
    expect(screen.queryByTestId("deviation-name")).toBeNull();
  });
});
