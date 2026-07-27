import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ArchivePeriodModal } from "./ArchivePeriodModal";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";

// jsdom does not implement HTMLDialogElement.showModal / close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const makeEntry = (overrides: Partial<SavingsEntry> = {}): SavingsEntry => ({
  id: "e1",
  type: "gasto",
  amount: 500,
  date: "2026-01-15",
  toReplenish: false,
  createdAt: "2026-01-15T00:00:00Z",
  ...overrides,
});

describe("ArchivePeriodModal", () => {
  it("shows a pending-to-replenish warning with count and amount when there are pending gastos", () => {
    const entries = [
      makeEntry({ id: "e1", toReplenish: true, amount: 300 }),
      makeEntry({ id: "e2", toReplenish: true, amount: 200 }),
      makeEntry({ id: "e3", type: "deposito", toReplenish: false, amount: 1000 }),
    ];
    render(
      <ArchivePeriodModal isOpen entries={entries} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(screen.getByText(/2 gastos/i)).toBeTruthy();
    expect(screen.getByText(/\$500/)).toBeTruthy();
  });

  it("shows no warning when there are no pending gastos", () => {
    const entries = [makeEntry({ id: "e1", toReplenish: false })];
    render(
      <ArchivePeriodModal isOpen entries={entries} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(screen.queryByText(/pendiente/i)).toBeNull();
  });

  it("lets the owner set an optional initial amount and label for the new period", () => {
    const onConfirm = vi.fn();
    render(
      <ArchivePeriodModal isOpen entries={[]} onClose={vi.fn()} onConfirm={onConfirm} />
    );
    fireEvent.change(screen.getByLabelText(/monto inicial/i), { target: { value: "5000" } });
    fireEvent.change(screen.getByLabelText(/nombre del nuevo per.odo/i), {
      target: { value: "Abril" },
    });
    fireEvent.click(screen.getByText("Archivar y empezar de nuevo"));
    expect(onConfirm).toHaveBeenCalledWith({ initialAmount: 5000, label: "Abril" });
  });

  it("submits with initialAmount and label undefined when left blank", () => {
    const onConfirm = vi.fn();
    render(
      <ArchivePeriodModal isOpen entries={[]} onClose={vi.fn()} onConfirm={onConfirm} />
    );
    fireEvent.click(screen.getByText("Archivar y empezar de nuevo"));
    expect(onConfirm).toHaveBeenCalledWith({ initialAmount: undefined, label: undefined });
  });

  it("does not call onConfirm when the user cancels instead of confirming", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ArchivePeriodModal isOpen entries={[]} onClose={onClose} onConfirm={onConfirm} />
    );
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
