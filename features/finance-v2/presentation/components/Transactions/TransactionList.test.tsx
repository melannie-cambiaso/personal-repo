import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionList } from "./TransactionList";
import type { DayGroup } from "@/features/finance-v2/domain";

describe("TransactionList", () => {
  it("shows an empty-state message when there are no groups", () => {
    render(<TransactionList dayGroups={[]} onDelete={vi.fn()} />);

    expect(screen.getByText(/no hay movimientos/i)).toBeTruthy();
  });

  it("renders day groups and their transactions in the ORDER GIVEN — it does not re-sort", () => {
    const dayGroups: DayGroup[] = [
      {
        date: "2026-07-25",
        transactions: [
          { id: "t3", type: "income", amount: 300, date: "2026-07-25", month: "2026-07" },
          { id: "t2", type: "income", amount: 200, date: "2026-07-25", month: "2026-07" },
        ],
      },
      {
        date: "2026-07-01",
        transactions: [
          { id: "t1", type: "savings", amount: 100, date: "2026-07-01", month: "2026-07" },
        ],
      },
    ];

    render(<TransactionList dayGroups={dayGroups} onDelete={vi.fn()} />);

    expect(screen.getByText("2026-07-25")).toBeTruthy();
    expect(screen.getByText("2026-07-01")).toBeTruthy();

    const amounts = screen.getAllByText(/\$\d/).map((el) => el.textContent);
    expect(amounts).toEqual(["$300", "$200", "$100"]);
  });
});
