import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionRow } from "./TransactionRow";
import type { FinanceV2Transaction } from "@/features/finance-v2/domain";

describe("TransactionRow", () => {
  it("clicking delete calls onDelete with the transaction's id", () => {
    const onDelete = vi.fn();
    const tx: FinanceV2Transaction = { id: "t1", type: "income", amount: 1000, date: "2026-07-01" };

    render(<TransactionRow transaction={tx} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(onDelete).toHaveBeenCalledWith("t1");
  });

  it("renders the SNAPSHOTTED category name for an expense linked to a subcategory — no live lookup happens (the component receives no live category list at all)", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "expense",
      amount: 500,
      date: "2026-07-01",
      bucket: "fixed",
      category: { id: "deleted-subcategory-id", name: "Renta" },
    };

    render(<TransactionRow transaction={tx} onDelete={vi.fn()} />);

    expect(screen.getByText("Renta")).toBeTruthy();
  });

  it("falls back to the bucket label for a loose expense with no category ref", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "expense",
      amount: 500,
      date: "2026-07-01",
      bucket: "variable",
      category: null,
    };

    render(<TransactionRow transaction={tx} onDelete={vi.fn()} />);

    expect(screen.getByText("Variables")).toBeTruthy();
  });

  it("shows the transaction's note when present", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "savings",
      amount: 200,
      date: "2026-07-01",
      note: "Fondo de emergencia",
    };

    render(<TransactionRow transaction={tx} onDelete={vi.fn()} />);

    expect(screen.getByText("Fondo de emergencia")).toBeTruthy();
  });

  it("shows the formatted amount", () => {
    const tx: FinanceV2Transaction = { id: "t1", type: "income", amount: 1000, date: "2026-07-01" };

    render(<TransactionRow transaction={tx} onDelete={vi.fn()} />);

    expect(screen.getByText("$1.000")).toBeTruthy();
  });
});
