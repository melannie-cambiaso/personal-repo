import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionRow } from "./TransactionRow";
import type { FinanceV2Transaction } from "@/features/finance-v2/domain";

describe("TransactionRow", () => {
  it("clicking delete calls onDelete with the transaction's id", () => {
    const onDelete = vi.fn();
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "income",
      amount: 1000,
      date: "2026-07-01",
      month: "2026-07",
    };

    render(
      <TransactionRow transaction={tx} envelopeName={null} onDelete={onDelete} onEdit={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(onDelete).toHaveBeenCalledWith("t1");
  });

  it("clicking edit calls onEdit with the transaction object", () => {
    const onEdit = vi.fn();
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "income",
      amount: 1000,
      date: "2026-07-01",
      month: "2026-07",
    };

    render(
      <TransactionRow transaction={tx} envelopeName={null} onDelete={vi.fn()} onEdit={onEdit} />
    );
    fireEvent.click(screen.getByRole("button", { name: /editar/i }));

    expect(onEdit).toHaveBeenCalledWith(tx);
  });

  it("renders the SNAPSHOTTED category name for an expense linked to a subcategory — no live lookup happens (the component receives no live category list at all)", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "expense",
      amount: 500,
      date: "2026-07-01",
      month: "2026-07",
      bucket: "fixed",
      category: { id: "deleted-subcategory-id", name: "Renta" },
    };

    render(
      <TransactionRow transaction={tx} envelopeName={null} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

    expect(screen.getByText("Renta")).toBeTruthy();
  });

  it("falls back to the bucket label for a loose expense with no category ref", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "expense",
      amount: 500,
      date: "2026-07-01",
      month: "2026-07",
      bucket: "variable",
      category: null,
    };

    render(
      <TransactionRow transaction={tx} envelopeName={null} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

    expect(screen.getByText("Variables")).toBeTruthy();
  });

  it("shows the transaction's note when present", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "savings",
      amount: 200,
      date: "2026-07-01",
      month: "2026-07",
      note: "Fondo de emergencia",
    };

    render(
      <TransactionRow transaction={tx} envelopeName={null} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

    expect(screen.getByText("Fondo de emergencia")).toBeTruthy();
  });

  it("shows a secondary source line for a tagged savings transaction", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "savings",
      amount: 20000,
      date: "2026-07-01",
      month: "2026-07",
      sourceCategory: { id: "super", name: "Supermercado", bucket: "variable" },
    };

    render(
      <TransactionRow transaction={tx} envelopeName={null} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

    expect(screen.getByText("de Supermercado")).toBeTruthy();
  });

  it("renders nothing extra for an untagged savings transaction", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "savings",
      amount: 20000,
      date: "2026-07-01",
      month: "2026-07",
    };

    render(
      <TransactionRow transaction={tx} envelopeName={null} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

    expect(screen.queryByText(/^de /)).toBeNull();
  });

  it("shows BOTH the source line and the note when a tagged savings transaction has a note", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "savings",
      amount: 20000,
      date: "2026-07-01",
      month: "2026-07",
      note: "Fondo de emergencia",
      sourceCategory: { id: "super", name: "Supermercado", bucket: "variable" },
    };

    render(
      <TransactionRow transaction={tx} envelopeName={null} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

    expect(screen.getByText("de Supermercado")).toBeTruthy();
    expect(screen.getByText("Fondo de emergencia")).toBeTruthy();
  });

  it("shows the formatted amount", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "income",
      amount: 1000,
      date: "2026-07-01",
      month: "2026-07",
    };

    render(
      <TransactionRow transaction={tx} envelopeName={null} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

    expect(screen.getByText("$1.000")).toBeTruthy();
  });

  it("labels a transfer with the configured envelope's name", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "transfer",
      amount: 116000,
      date: "2026-07-01",
      month: "2026-07",
    };

    render(
      <TransactionRow
        transaction={tx}
        envelopeName="Servicios"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText("Transferencia → Servicios")).toBeTruthy();
  });

  it("falls back to the plain type label for a transfer when no envelope is configured", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "transfer",
      amount: 116000,
      date: "2026-07-01",
      month: "2026-07",
    };

    render(
      <TransactionRow transaction={tx} envelopeName={null} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

    expect(screen.getByText("Transferencia")).toBeTruthy();
  });

  it("shows a secondary funding line for an envelope-paid expense", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "expense",
      amount: 43000,
      date: "2026-07-01",
      month: "2026-07",
      bucket: "fixed",
      category: { id: "luz", name: "Luz" },
      paidFrom: "envelope",
    };

    render(
      <TransactionRow
        transaction={tx}
        envelopeName="Servicios"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText("Luz")).toBeTruthy();
    expect(screen.getByText("desde Servicios")).toBeTruthy();
  });

  it("shows no funding line for a main-account expense", () => {
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "expense",
      amount: 20000,
      date: "2026-07-01",
      month: "2026-07",
      bucket: "variable",
      category: null,
    };

    render(
      <TransactionRow
        transaction={tx}
        envelopeName="Servicios"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.queryByText(/^desde /)).toBeNull();
  });
});

describe("TransactionRow — income source", () => {
  const income: FinanceV2Transaction = {
    id: "t1",
    type: "income",
    amount: 1_000_000,
    date: "2026-07-01",
    month: "2026-07",
  };
  const renderRow = (tx: FinanceV2Transaction) =>
    render(
      <TransactionRow transaction={tx} envelopeName={null} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

  // Snapshot name, like the savings source: a source deleted from the budget still shows.
  it("shows the snapshotted source as a secondary line under the type label", () => {
    renderRow({ ...income, source: { id: "gone", name: "Sueldo" }, note: "Octubre" });

    expect(screen.getByText("Ingreso")).toBeTruthy();
    expect(screen.getByText("de Sueldo")).toBeTruthy();
    expect(screen.getByText("Octubre")).toBeTruthy();
  });

  it("renders nothing extra for an income without a source", () => {
    renderRow(income);

    expect(screen.getByText("Ingreso")).toBeTruthy();
    expect(screen.queryByText(/^de /)).toBeNull();
  });
});

describe("TransactionRow — savings fund", () => {
  const fundExpense: FinanceV2Transaction = {
    id: "f1",
    type: "expense",
    amount: 7000,
    date: "2026-07-03",
    month: "2026-07",
    bucket: "variable",
    category: { id: "super", name: "Supermercado" },
    paidFrom: "savingsFund",
  };
  const withdrawal: FinanceV2Transaction = {
    id: "w1",
    type: "withdrawal",
    amount: 20000,
    date: "2026-07-02",
    month: "2026-07",
  };
  const renderRow = (tx: FinanceV2Transaction, savingsFundName?: string | null) =>
    render(
      <TransactionRow
        transaction={tx}
        envelopeName={null}
        savingsFundName={savingsFundName}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

  it("shows 'desde <fund name>' under a fund-paid expense, keeping its category as the label", () => {
    renderRow(fundExpense, "Ahorros");

    expect(screen.getByText("Supermercado")).toBeTruthy();
    expect(screen.getByText("desde Ahorros")).toBeTruthy();
  });

  it("falls back to a generic name when the fund config is gone, so the stamp never vanishes", () => {
    renderRow(fundExpense, null);

    expect(screen.getByText("desde ahorros")).toBeTruthy();
  });

  it("does not mark a main-account expense as fund-paid", () => {
    renderRow(
      {
        id: "m1",
        type: "expense",
        amount: 7000,
        date: "2026-07-03",
        month: "2026-07",
        bucket: "variable",
        category: { id: "super", name: "Supermercado" },
      },
      "Ahorros"
    );

    expect(screen.queryByText(/^desde /)).toBeNull();
  });

  it("labels a withdrawal with the fund name, or generically without one", () => {
    renderRow(withdrawal, "Ahorros");
    expect(screen.getByText("Retiro de Ahorros")).toBeTruthy();
  });

  it("labels a withdrawal generically when no fund name is known", () => {
    renderRow(withdrawal, null);
    expect(screen.getByText("Retiro de ahorros")).toBeTruthy();
  });
});
