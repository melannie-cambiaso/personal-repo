import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SavingsScreen } from "./SavingsScreen";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import type { SavingsGoal } from "@/features/savings/domain/SavingsGoal";
import type { SavingsPeriod } from "@/features/savings/domain/SavingsPeriod";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("SavingsScreen", () => {
  it("passes only active (isDone !== true) goals to the Add Entry goal selector", () => {
    const goals: SavingsGoal[] = [
      { id: "1", name: "Active Goal", targetAmount: 1000, priority: 1, createdAt: "2026-01-01T00:00:00Z", isDone: false },
      { id: "2", name: "Done Goal", targetAmount: 500, priority: 2, createdAt: "2026-01-02T00:00:00Z", isDone: true },
    ];
    const entries: SavingsEntry[] = [];

    render(
      <SavingsScreen
        initialEntries={entries}
        initialGoals={goals}
        isOwner={true}
        onSave={vi.fn()}
        onSaveGoals={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Agregar registro" }));
    const select = screen.getByLabelText("Meta") as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((o) => o.textContent);
    expect(optionLabels).toContain("Active Goal");
    expect(optionLabels).not.toContain("Done Goal");
  });

  it("selecting the Archivados tab renders the archived period list", () => {
    const periods: SavingsPeriod[] = [
      {
        id: "p1",
        startedAt: "2026-01-01T00:00:00Z",
        closedAt: "2026-02-01T00:00:00Z",
        initialAmount: 0,
        label: "Enero",
      },
    ];
    const allEntries: SavingsEntry[] = [
      {
        id: "e1",
        type: "deposito",
        amount: 100,
        date: "2026-01-15",
        toReplenish: false,
        createdAt: "2026-01-15T00:00:00Z",
        periodId: "p1",
      },
    ];

    render(
      <SavingsScreen
        initialEntries={[]}
        isOwner={true}
        onSave={vi.fn()}
        periods={periods}
        allEntries={allEntries}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Archivados" }));
    expect(screen.getByRole("heading", { level: 3, name: "Enero" })).toBeTruthy();
  });

  it("shows an owner-only archive trigger that opens the confirm modal and calls onArchive on confirm", () => {
    const onArchive = vi.fn();
    render(
      <SavingsScreen
        initialEntries={[]}
        isOwner={true}
        onSave={vi.fn()}
        onArchive={onArchive}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Archivar período" }));
    expect(screen.getByText(/se cerrará como archivo de solo lectura/i)).toBeTruthy();

    fireEvent.click(screen.getByText("Archivar y empezar de nuevo"));
    expect(onArchive).toHaveBeenCalledOnce();
  });

  it("does not show the archive trigger for non-owners", () => {
    render(<SavingsScreen initialEntries={[]} isOwner={false} onSave={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Archivar período" })).toBeNull();
  });
});
