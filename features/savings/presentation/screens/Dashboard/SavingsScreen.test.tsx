import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SavingsScreen } from "./SavingsScreen";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import type { SavingsGoal } from "@/features/savings/domain/SavingsGoal";
import type { SavingsPeriod } from "@/features/savings/domain/SavingsPeriod";

// The section lives in `?section=`, chosen from the app sidebar (`AppNav`).
const { useSearchParams } = vi.hoisted(() => ({ useSearchParams: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams }));
const openSection = (section: string) =>
  useSearchParams.mockReturnValue(new URLSearchParams({ section }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

beforeEach(() => {
  useSearchParams.mockReturnValue(new URLSearchParams());
});

describe("SavingsScreen", () => {
  it("passes only active (isDone !== true) goals to the Add Entry goal selector", () => {
    const goals: SavingsGoal[] = [
      {
        id: "1",
        name: "Active Goal",
        targetAmount: 1000,
        priority: 1,
        createdAt: "2026-01-01T00:00:00Z",
        isDone: false,
      },
      {
        id: "2",
        name: "Done Goal",
        targetAmount: 500,
        priority: 2,
        createdAt: "2026-01-02T00:00:00Z",
        isDone: true,
      },
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

  it("opens Historial by default, titled after the section", () => {
    render(<SavingsScreen initialEntries={[]} isOwner={true} onSave={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Historial" })).toBeTruthy();
  });

  it("falls back to Historial for an unknown section param", () => {
    openSection("nope");
    render(<SavingsScreen initialEntries={[]} isOwner={true} onSave={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Historial" })).toBeTruthy();
  });

  it("renders no in-page section switcher (sections live in the app sidebar)", () => {
    render(<SavingsScreen initialEntries={[]} isOwner={true} onSave={vi.fn()} />);
    for (const name of ["Historial", "Metas", "Por mes", "Archivados"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
  });

  it("the Archivados section renders the archived period list", () => {
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

    openSection("archived");
    render(
      <SavingsScreen
        initialEntries={[]}
        isOwner={true}
        onSave={vi.fn()}
        periods={periods}
        allEntries={allEntries}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Archivados" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Enero" })).toBeTruthy();
  });

  it("shows an owner-only archive trigger that opens the confirm modal and calls onArchive on confirm", () => {
    const onArchive = vi.fn();
    render(
      <SavingsScreen initialEntries={[]} isOwner={true} onSave={vi.fn()} onArchive={onArchive} />
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
