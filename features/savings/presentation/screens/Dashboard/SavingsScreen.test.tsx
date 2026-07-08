import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SavingsScreen } from "./SavingsScreen";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import type { SavingsGoal } from "@/features/savings/domain/SavingsGoal";

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
});
