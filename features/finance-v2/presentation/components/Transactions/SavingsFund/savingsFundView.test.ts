import { describe, it, expect } from "vitest";
import { toSavingsFundView } from "./savingsFundView";
import type { FinanceV2Transaction, SavingsFundConfig } from "@/features/finance-v2/domain";

const config: SavingsFundConfig = {
  name: "Ahorros",
  openingBalance: 500_000,
  openingMonth: "2026-10",
};

const base = { date: "2026-11-05", month: "2026-11" };

const transactions: FinanceV2Transaction[] = [
  { id: "1", type: "savings", amount: 50_000, ...base },
  { id: "2", type: "withdrawal", amount: 20_000, ...base },
  {
    id: "3",
    type: "expense",
    amount: 7_000,
    bucket: "variable",
    category: { id: "super", name: "Supermercado" },
    paidFrom: "savingsFund",
    ...base,
  },
];

describe("toSavingsFundView", () => {
  it("is null when no fund is configured", () => {
    expect(
      toSavingsFundView({ config: null, carriedIn: 1, isLoading: false, transactions })
    ).toBeNull();
  });

  it("carries the config, the carried-in balance and the viewed month's flows", () => {
    const view = toSavingsFundView({
      config,
      carriedIn: 480_000,
      isLoading: false,
      transactions,
    });

    expect(view).toEqual({
      config,
      carriedIn: 480_000,
      flows: { deposited: 50_000, withdrawn: 20_000, spent: 7_000 },
    });
  });

  it("hides the carried-in balance while loading, so consumers need no loading flag", () => {
    const view = toSavingsFundView({ config, carriedIn: 480_000, isLoading: true, transactions });

    expect(view?.carriedIn).toBeNull();
  });
});
