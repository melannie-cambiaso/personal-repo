import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionCard } from "./TransactionCard";
import type { FinanceTransaction } from "@/features/finance/domain";

const tx = (overrides: Partial<FinanceTransaction> = {}): FinanceTransaction => ({
  id: "tx-1",
  category: "Comida",
  amount: 1000,
  createdAt: "2026-06-01T12:00:00.000Z",
  ...overrides,
});

describe("TransactionCard", () => {
  it("renders the formatted amount", () => {
    render(
      <TransactionCard
        transaction={tx({ amount: 1000 })}
        onDelete={vi.fn()}
      />,
    );
    // Math.round(1000).toLocaleString("es-AR") → "1.000" in es-AR locale
    expect(screen.getByText(/\$1.000/)).toBeTruthy();
  });

  it("renders category when showCategory is true", () => {
    render(
      <TransactionCard
        transaction={tx({ category: "Comida" })}
        showCategory={true}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Comida")).toBeTruthy();
  });

  it("does NOT render category when showCategory is false (default)", () => {
    render(
      <TransactionCard
        transaction={tx({ category: "Comida" })}
        showCategory={false}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByText("Comida")).toBeNull();
  });

  it("does NOT render category when showCategory is omitted", () => {
    render(
      <TransactionCard
        transaction={tx({ category: "Comida" })}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByText("Comida")).toBeNull();
  });

  it("renders groupName when provided", () => {
    render(
      <TransactionCard
        transaction={tx()}
        groupName="Alimentación"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Alimentación")).toBeTruthy();
  });

  it("renders the note when transaction.note is present", () => {
    render(
      <TransactionCard
        transaction={tx({ note: "super del martes" })}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("super del martes")).toBeTruthy();
  });

  it("does NOT render a note element when transaction.note is absent", () => {
    render(
      <TransactionCard
        transaction={tx({ note: undefined })}
        onDelete={vi.fn()}
      />,
    );
    // No note span in the DOM at all
    expect(screen.queryByTestId("tx-note")).toBeNull();
  });

  it("calls onDelete with transaction.id when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(
      <TransactionCard
        transaction={tx({ id: "tx-42" })}
        onDelete={onDelete}
      />,
    );
    const deleteBtn = screen.getByRole("button", { name: /eliminar/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith("tx-42");
  });
});
