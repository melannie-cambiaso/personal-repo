import { describe, it, expect } from "vitest";
import { computeMonthAnalysis } from "./monthAnalysis";
import type { BudgetConfig } from "./BudgetConfig";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

// 2026-08 has 5 Mondays, 2026-09 has 4 — the whole point of this feature.
const FIVE_WEEK_MONTH = "2026-08";
const FOUR_WEEK_MONTH = "2026-09";
// 2026-05 has 5 Sundays but 4 Mondays; 2026-06 has 4 Sundays but 5 Mondays
// (weekday uses `Date#getDay`: 0 = Sunday).
const FIVE_SUNDAY_MONTH = "2026-05";

function expense(
  id: string,
  amount: number,
  category: { id: string; name: string } | null,
  bucket: "fixed" | "variable" = "variable",
): FinanceV2Transaction {
  return {
    id,
    type: "expense",
    amount,
    date: `${FIVE_WEEK_MONTH}-10`,
    month: FIVE_WEEK_MONTH,
    bucket,
    category,
  };
}

const EMPTY_CONFIG: BudgetConfig = { categories: [] };

describe("computeMonthAnalysis", () => {
  describe("summary", () => {
    it("reports the analyzed month without a month-wide week count", () => {
      const analysis = computeMonthAnalysis(EMPTY_CONFIG, [], FIVE_WEEK_MONTH);

      expect(analysis.summary.month).toBe(FIVE_WEEK_MONTH);
      // Weeks depend on each weekly leaf's weekday, so they live per leaf.
      expect(analysis.summary).not.toHaveProperty("weeks");
    });

    it("reports the week-adjusted budget, the actual spend and the difference", () => {
      const config: BudgetConfig = {
        categories: [
          { id: "food", name: "Comida", bucket: "variable", amount: 20_000, frequency: "weekly", subcategories: [] },
          { id: "rent", name: "Arriendo", bucket: "fixed", amount: 300_000, subcategories: [] },
        ],
      };
      const transactions = [
        expense("t1", 90_000, { id: "food", name: "Comida" }),
        expense("t2", 300_000, { id: "rent", name: "Arriendo" }, "fixed"),
      ];

      const analysis = computeMonthAnalysis(config, transactions, FIVE_WEEK_MONTH);

      // weekly 20.000 x 5 Mondays + fixed 300.000
      expect(analysis.summary.budgeted).toBe(400_000);
      expect(analysis.summary.spent).toBe(390_000);
      expect(analysis.summary.difference).toBe(10_000);
    });

    it("reports a negative difference when the month overran its budget", () => {
      const config: BudgetConfig = {
        categories: [{ id: "food", name: "Comida", bucket: "variable", amount: 50_000, subcategories: [] }],
      };
      const transactions = [expense("t1", 65_000, { id: "food", name: "Comida" })];

      const analysis = computeMonthAnalysis(config, transactions, FIVE_WEEK_MONTH);

      expect(analysis.summary.difference).toBe(-15_000);
    });

    it("includes untagged spend in the actual total and exposes it separately", () => {
      const config: BudgetConfig = {
        categories: [{ id: "food", name: "Comida", bucket: "variable", amount: 50_000, subcategories: [] }],
      };
      const transactions = [
        expense("t1", 40_000, { id: "food", name: "Comida" }),
        expense("t2", 7_000, null),
      ];

      const analysis = computeMonthAnalysis(config, transactions, FIVE_WEEK_MONTH);

      expect(analysis.summary.spent).toBe(47_000);
      expect(analysis.summary.unassigned).toBe(7_000);
    });

    it("yields a zero summary for an empty config and no transactions", () => {
      const analysis = computeMonthAnalysis(EMPTY_CONFIG, [], FIVE_WEEK_MONTH);

      expect(analysis.summary.budgeted).toBe(0);
      expect(analysis.summary.spent).toBe(0);
      expect(analysis.summary.difference).toBe(0);
      expect(analysis.summary.unassigned).toBe(0);
    });
  });

  describe("deviations", () => {
    it("sorts leaves from the biggest overrun to the biggest saving", () => {
      const config: BudgetConfig = {
        categories: [
          { id: "saver", name: "Ahorrador", bucket: "variable", amount: 100_000, subcategories: [] },
          { id: "onTrack", name: "En linea", bucket: "variable", amount: 50_000, subcategories: [] },
          { id: "overrun", name: "Excedido", bucket: "variable", amount: 30_000, subcategories: [] },
        ],
      };
      const transactions = [
        expense("t1", 40_000, { id: "saver", name: "Ahorrador" }),
        expense("t2", 50_000, { id: "onTrack", name: "En linea" }),
        expense("t3", 55_000, { id: "overrun", name: "Excedido" }),
      ];

      const analysis = computeMonthAnalysis(config, transactions, FIVE_WEEK_MONTH);

      expect(analysis.deviations.map((d) => d.id)).toEqual(["overrun", "onTrack", "saver"]);
      expect(analysis.deviations.map((d) => d.deviation)).toEqual([25_000, 0, -60_000]);
    });

    it("carries each leaf's name, bucket and resolved frequency", () => {
      const config: BudgetConfig = {
        categories: [
          { id: "food", name: "Comida", bucket: "variable", amount: 20_000, frequency: "weekly", subcategories: [] },
          { id: "rent", name: "Arriendo", bucket: "fixed", amount: 300_000, subcategories: [] },
        ],
      };

      const analysis = computeMonthAnalysis(config, [], FIVE_WEEK_MONTH);
      const byId = Object.fromEntries(analysis.deviations.map((d) => [d.id, d]));

      expect(byId.food).toMatchObject({ name: "Comida", bucket: "variable", frequency: "weekly" });
      // A legacy leaf with no persisted frequency reads as monthly, never undefined.
      expect(byId.rent).toMatchObject({ name: "Arriendo", bucket: "fixed", frequency: "monthly" });
    });

    it("exposes a per-week budget and per-week actual average for a weekly leaf", () => {
      const config: BudgetConfig = {
        categories: [
          { id: "food", name: "Comida", bucket: "variable", amount: 20_000, frequency: "weekly", subcategories: [] },
        ],
      };
      const transactions = [expense("t1", 125_000, { id: "food", name: "Comida" })];

      const analysis = computeMonthAnalysis(config, transactions, FIVE_WEEK_MONTH);

      expect(analysis.deviations[0].budgeted).toBe(100_000);
      expect(analysis.deviations[0].perWeek).toEqual({ budgeted: 20_000, spentAvg: 25_000, weeks: 5 });
    });

    it("leaves the per-week block null for a monthly leaf", () => {
      const config: BudgetConfig = {
        categories: [{ id: "rent", name: "Arriendo", bucket: "fixed", amount: 300_000, subcategories: [] }],
      };

      const analysis = computeMonthAnalysis(config, [], FIVE_WEEK_MONTH);

      expect(analysis.deviations[0].perWeek).toBeNull();
    });

    it("names the parent of a subcategory leaf and omits the parent as its own row", () => {
      const config: BudgetConfig = {
        categories: [
          {
            id: "home",
            name: "Casa",
            bucket: "fixed",
            amount: 0,
            subcategories: [
              { id: "light", name: "Luz", bucket: "fixed", amount: 30_000 },
              { id: "water", name: "Agua", bucket: "fixed", amount: 20_000 },
            ],
          },
        ],
      };
      const transactions = [expense("t1", 35_000, { id: "light", name: "Luz" }, "fixed")];

      const analysis = computeMonthAnalysis(config, transactions, FIVE_WEEK_MONTH);

      expect(analysis.deviations.map((d) => d.id)).toEqual(["light", "water"]);
      expect(analysis.deviations[0]).toMatchObject({ name: "Luz", parentName: "Casa" });
    });

    it("omits a leaf that has neither budget nor spend", () => {
      const config: BudgetConfig = {
        categories: [
          { id: "unused", name: "Sin uso", bucket: "variable", amount: 0, subcategories: [] },
          { id: "food", name: "Comida", bucket: "variable", amount: 50_000, subcategories: [] },
        ],
      };

      const analysis = computeMonthAnalysis(config, [], FIVE_WEEK_MONTH);

      expect(analysis.deviations.map((d) => d.id)).toEqual(["food"]);
    });

    it("keeps an unbudgeted leaf that was nevertheless spent on", () => {
      const config: BudgetConfig = {
        categories: [{ id: "extra", name: "Extra", bucket: "variable", amount: 0, subcategories: [] }],
      };
      const transactions = [expense("t1", 12_000, { id: "extra", name: "Extra" })];

      const analysis = computeMonthAnalysis(config, transactions, FIVE_WEEK_MONTH);

      expect(analysis.deviations).toHaveLength(1);
      expect(analysis.deviations[0]).toMatchObject({ id: "extra", budgeted: 0, spent: 12_000 });
    });
  });

  describe("next month", () => {
    it("reports the following month without a month-wide week count", () => {
      const analysis = computeMonthAnalysis(EMPTY_CONFIG, [], FIVE_WEEK_MONTH);

      expect(analysis.nextMonth.month).toBe("2026-09");
      expect(analysis.nextMonth).not.toHaveProperty("weeks");
    });

    it("rolls the year over at december", () => {
      const analysis = computeMonthAnalysis(EMPTY_CONFIG, [], "2026-12");

      expect(analysis.nextMonth.month).toBe("2027-01");
    });

    it("projects next month's budget with next month's week count", () => {
      const config: BudgetConfig = {
        categories: [
          { id: "food", name: "Comida", bucket: "variable", amount: 20_000, frequency: "weekly", subcategories: [] },
          { id: "rent", name: "Arriendo", bucket: "fixed", amount: 300_000, subcategories: [] },
        ],
      };

      const analysis = computeMonthAnalysis(config, [], FIVE_WEEK_MONTH);

      // weekly 20.000 x 4 Mondays in 2026-09 + unchanged fixed 300.000
      expect(analysis.nextMonth.budgeted).toBe(380_000);
    });

    it("projects a weekly overrun at the current per-week pace, scaled to next month's weeks", () => {
      const config: BudgetConfig = {
        categories: [
          { id: "food", name: "Comida", bucket: "variable", amount: 20_000, frequency: "weekly", subcategories: [] },
        ],
      };
      // 125.000 over 5 weeks = 25.000/week pace against a 20.000/week budget.
      const transactions = [expense("t1", 125_000, { id: "food", name: "Comida" })];

      const analysis = computeMonthAnalysis(config, transactions, FIVE_WEEK_MONTH);

      expect(analysis.nextMonth.overruns).toEqual([
        { id: "food", name: "Comida", parentName: undefined, weeks: 4, budgeted: 80_000, projectedSpend: 100_000, projectedOverrun: 20_000 },
      ]);
    });

    it("projects a monthly overrun as a flat repeat of this month's spend", () => {
      const config: BudgetConfig = {
        categories: [{ id: "gym", name: "Gimnasio", bucket: "fixed", amount: 30_000, subcategories: [] }],
      };
      const transactions = [expense("t1", 45_000, { id: "gym", name: "Gimnasio" }, "fixed")];

      const analysis = computeMonthAnalysis(config, transactions, FIVE_WEEK_MONTH);

      expect(analysis.nextMonth.overruns[0]).toMatchObject({
        weeks: null,
        budgeted: 30_000,
        projectedSpend: 45_000,
        projectedOverrun: 15_000,
      });
    });

    it("lists only overrun leaves, biggest projected overrun first", () => {
      const config: BudgetConfig = {
        categories: [
          { id: "small", name: "Chico", bucket: "variable", amount: 10_000, subcategories: [] },
          { id: "big", name: "Grande", bucket: "variable", amount: 10_000, subcategories: [] },
          { id: "fine", name: "Bien", bucket: "variable", amount: 50_000, subcategories: [] },
        ],
      };
      const transactions = [
        expense("t1", 15_000, { id: "small", name: "Chico" }),
        expense("t2", 90_000, { id: "big", name: "Grande" }),
        expense("t3", 20_000, { id: "fine", name: "Bien" }),
      ];

      const analysis = computeMonthAnalysis(config, transactions, FIVE_WEEK_MONTH);

      expect(analysis.nextMonth.overruns.map((o) => o.id)).toEqual(["big", "small"]);
    });

    it("does not treat spending exactly the budget as an overrun", () => {
      const config: BudgetConfig = {
        categories: [{ id: "food", name: "Comida", bucket: "variable", amount: 50_000, subcategories: [] }],
      };
      const transactions = [expense("t1", 50_000, { id: "food", name: "Comida" })];

      const analysis = computeMonthAnalysis(config, transactions, FIVE_WEEK_MONTH);

      expect(analysis.nextMonth.overruns).toEqual([]);
    });

    it("keeps a weekly overrun that next month's extra weeks turn into a bigger gap", () => {
      const config: BudgetConfig = {
        categories: [
          { id: "food", name: "Comida", bucket: "variable", amount: 20_000, frequency: "weekly", subcategories: [] },
        ],
      };
      // 4-week month: 100.000 spent over 4 weeks = 25.000/week vs 20.000/week budget.
      const transactions = [
        { ...expense("t1", 100_000, { id: "food", name: "Comida" }), month: FOUR_WEEK_MONTH },
      ];

      const analysis = computeMonthAnalysis(config, transactions, FOUR_WEEK_MONTH);

      // Next month (2026-10) has 4 Mondays: 25.000 x 4 = 100.000 projected vs 80.000 budget.
      expect(analysis.nextMonth.overruns[0]).toMatchObject({
        weeks: 4,
        projectedSpend: 100_000,
        projectedOverrun: 20_000,
      });
    });

    it("yields no projected overruns when nothing was overspent", () => {
      const config: BudgetConfig = {
        categories: [{ id: "food", name: "Comida", bucket: "variable", amount: 50_000, subcategories: [] }],
      };

      const analysis = computeMonthAnalysis(config, [], FIVE_WEEK_MONTH);

      expect(analysis.nextMonth.overruns).toEqual([]);
    });
  });

  describe("weekday-aware weeks", () => {
    // Cleaning every Sunday: 20.000/week, 125.000 spent in May 2026.
    const config: BudgetConfig = {
      categories: [
        {
          id: "clean",
          name: "Limpieza",
          bucket: "variable",
          amount: 20_000,
          frequency: "weekly",
          weekday: 0,
          subcategories: [],
        },
      ],
    };
    const transactions = [
      { ...expense("t1", 125_000, { id: "clean", name: "Limpieza" }), month: FIVE_SUNDAY_MONTH },
    ];

    it("averages a weekly leaf's spend over its own weekday's occurrences", () => {
      const analysis = computeMonthAnalysis(config, transactions, FIVE_SUNDAY_MONTH);

      // 5 Sundays: 125.000 / 5 = 25.000, not 125.000 / 4 Mondays = 31.250.
      expect(analysis.deviations[0]).toMatchObject({
        budgeted: 100_000,
        perWeek: { budgeted: 20_000, spentAvg: 25_000, weeks: 5 },
      });
    });

    it("projects next month with the leaf's own weekday count", () => {
      const analysis = computeMonthAnalysis(config, transactions, FIVE_SUNDAY_MONTH);

      // 2026-06 has 4 Sundays: 25.000 x 4 = 100.000 projected vs 20.000 x 4 = 80.000.
      expect(analysis.nextMonth.overruns[0]).toMatchObject({
        weeks: 4,
        budgeted: 80_000,
        projectedSpend: 100_000,
        projectedOverrun: 20_000,
      });
    });
  });

  describe("legacy configs", () => {
    it("analyzes a config with no frequency field exactly as an all-monthly one", () => {
      const legacy: BudgetConfig = {
        categories: [
          { id: "rent", name: "Arriendo", bucket: "fixed", amount: 300_000, subcategories: [] },
          {
            id: "home",
            name: "Casa",
            bucket: "fixed",
            amount: 0,
            subcategories: [{ id: "light", name: "Luz", bucket: "fixed", amount: 30_000 }],
          },
        ],
      };

      const inFiveWeeks = computeMonthAnalysis(legacy, [], FIVE_WEEK_MONTH);
      const inFourWeeks = computeMonthAnalysis(legacy, [], FOUR_WEEK_MONTH);

      expect(inFiveWeeks.summary.budgeted).toBe(330_000);
      expect(inFourWeeks.summary.budgeted).toBe(330_000);
      expect(inFiveWeeks.nextMonth.budgeted).toBe(330_000);
      expect(inFiveWeeks.deviations.every((d) => d.perWeek === null)).toBe(true);
    });
  });
});
