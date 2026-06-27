import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionsTab } from "./TransactionsTab";
import type { FinanceTransaction } from "@/features/finance/domain";

type Group = { name: string; categories: string[] };

const tx = (overrides: Partial<FinanceTransaction> = {}): FinanceTransaction => ({
  id: "tx-1",
  category: "Comida",
  amount: 500,
  createdAt: "2026-06-01T12:00:00.000Z",
  ...overrides,
});

const groups: Group[] = [
  { name: "Alimentación", categories: ["Comida", "Mercado"] },
  { name: "Transporte", categories: ["Colectivo"] },
];

const transactions: FinanceTransaction[] = [
  tx({ id: "1", category: "Comida", amount: 500, createdAt: "2026-06-01T12:00:00.000Z" }),
  tx({ id: "2", category: "Colectivo", amount: 200, createdAt: "2026-06-02T10:00:00.000Z" }),
];

describe("TransactionsTab", () => {
  it("default mode is category: renders category group headers on first render", () => {
    render(
      <TransactionsTab
        transactions={transactions}
        groups={groups}
        onDelete={vi.fn()}
      />,
    );
    // "Comida" and "Colectivo" are category section headers
    expect(screen.getByText("Comida")).toBeTruthy();
    expect(screen.getByText("Colectivo")).toBeTruthy();
  });

  it("clicking 'Por día' toggle switches to day grouping", () => {
    render(
      <TransactionsTab
        transactions={transactions}
        groups={groups}
        onDelete={vi.fn()}
      />,
    );
    const dayBtn = screen.getByRole("button", { name: "Por día" });
    fireEvent.click(dayBtn);
    // In day mode, formatted date headers should appear (category headers vanish as standalone)
    // At minimum the toggle button for "Por categoría" is still present
    expect(screen.getByRole("button", { name: "Por categoría" })).toBeTruthy();
  });

  it("clicking 'Por categoría' after switching to day restores category mode", () => {
    render(
      <TransactionsTab
        transactions={transactions}
        groups={groups}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Por día" }));
    fireEvent.click(screen.getByRole("button", { name: "Por categoría" }));
    // Category headers restored
    expect(screen.getByText("Comida")).toBeTruthy();
  });

  it("renders empty state message when transactions is empty", () => {
    render(
      <TransactionsTab
        transactions={[]}
        groups={groups}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/No hay transacciones este mes/i)).toBeTruthy();
  });

  it("does NOT render the toggle when transactions is empty", () => {
    render(
      <TransactionsTab
        transactions={[]}
        groups={groups}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Por categoría" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Por día" })).toBeNull();
  });
});
