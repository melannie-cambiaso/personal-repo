import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddEntryModal } from "./AddEntryModal";
import type { SavingsGoal } from "@/features/savings/domain";

// jsdom does not implement HTMLDialogElement.showModal / close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const makeGoal = (overrides: Partial<SavingsGoal> = {}): SavingsGoal => ({
  id: "1",
  name: "Goal",
  targetAmount: 1000,
  priority: 1,
  createdAt: "2026-01-01T00:00:00Z",
  isDone: false,
  ...overrides,
});

describe("AddEntryModal", () => {
  it("shows the goal selector by default (type starts as deposito) when goals are provided", () => {
    const goals = [makeGoal({ id: "1", name: "Goal A" })];
    render(<AddEntryModal isOpen onClose={vi.fn()} onAdd={vi.fn()} goals={goals} />);
    expect(screen.getByLabelText("Meta")).toBeTruthy();
  });

  it("hides the goal selector when type is switched to gasto", () => {
    const goals = [makeGoal({ id: "1", name: "Goal A" })];
    render(<AddEntryModal isOpen onClose={vi.fn()} onAdd={vi.fn()} goals={goals} />);
    fireEvent.change(screen.getByLabelText("Tipo *"), { target: { value: "gasto" } });
    expect(screen.queryByLabelText("Meta")).toBeNull();
  });

  it("submits the selected goalId on a tagged deposit", () => {
    const goals = [makeGoal({ id: "g2", name: "Goal B" })];
    const onAdd = vi.fn();
    render(<AddEntryModal isOpen onClose={vi.fn()} onAdd={onAdd} goals={goals} />);
    fireEvent.change(screen.getByLabelText("Monto * ($)"), { target: { value: "500" } });
    fireEvent.change(screen.getByLabelText("Meta"), { target: { value: "g2" } });
    fireEvent.click(screen.getByText("Agregar ✓"));
    expect(onAdd).toHaveBeenCalledOnce();
    const submitted = onAdd.mock.calls[0][0];
    expect(submitted.goalId).toBe("g2");
    expect(submitted.type).toBe("deposito");
  });

  it("does not include goalId when the entry type is gasto, even if a goal was previously selected", () => {
    const goals = [makeGoal({ id: "g2", name: "Goal B" })];
    const onAdd = vi.fn();
    render(<AddEntryModal isOpen onClose={vi.fn()} onAdd={onAdd} goals={goals} />);
    fireEvent.change(screen.getByLabelText("Monto * ($)"), { target: { value: "500" } });
    fireEvent.change(screen.getByLabelText("Meta"), { target: { value: "g2" } });
    fireEvent.change(screen.getByLabelText("Tipo *"), { target: { value: "gasto" } });
    fireEvent.click(screen.getByText("Agregar ✓"));
    expect(onAdd).toHaveBeenCalledOnce();
    const submitted = onAdd.mock.calls[0][0];
    expect(submitted.goalId).toBeUndefined();
    expect(submitted.type).toBe("gasto");
  });

  it("submits with no goalId when 'Sin meta asignada' stays selected", () => {
    const goals = [makeGoal({ id: "g2", name: "Goal B" })];
    const onAdd = vi.fn();
    render(<AddEntryModal isOpen onClose={vi.fn()} onAdd={onAdd} goals={goals} />);
    fireEvent.change(screen.getByLabelText("Monto * ($)"), { target: { value: "500" } });
    fireEvent.click(screen.getByText("Agregar ✓"));
    expect(onAdd).toHaveBeenCalledOnce();
    const submitted = onAdd.mock.calls[0][0];
    expect(submitted.goalId).toBeUndefined();
  });

  it("renders no selector when goals prop is omitted", () => {
    render(<AddEntryModal isOpen onClose={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.queryByLabelText("Meta")).toBeNull();
  });
});
