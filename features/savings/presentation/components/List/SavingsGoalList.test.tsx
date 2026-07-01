import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SavingsGoalList } from "./SavingsGoalList";
import type { GoalWithProgress } from "@/features/savings/domain";

const makeGoal = (overrides: Partial<GoalWithProgress> = {}): GoalWithProgress => ({
  id: "goal-1",
  name: "Vacaciones",
  targetAmount: 1000,
  priority: 1,
  createdAt: "2026-01-01T00:00:00Z",
  isDone: false,
  currentAmount: 400,
  progress: 0.4,
  isCompleted: false,
  ...overrides,
});

const baseProps = {
  isOwner: true,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onReorder: vi.fn(),
  onToggleDone: vi.fn(),
};

describe("SavingsGoalList", () => {
  it("renders an empty-state message when goals is empty", () => {
    render(<SavingsGoalList {...baseProps} goals={[]} />);
    expect(screen.getByText(/todav.a no hay metas/i)).toBeTruthy();
  });

  it("renders one card per goal in priority order", () => {
    const goals = [
      makeGoal({ id: "1", name: "A", priority: 1 }),
      makeGoal({ id: "2", name: "B", priority: 2 }),
      makeGoal({ id: "3", name: "C", priority: 3 }),
    ];
    render(<SavingsGoalList {...baseProps} goals={goals} />);
    const names = screen.getAllByText(/^[ABC]$/).map((el) => el.textContent);
    expect(names).toEqual(["A", "B", "C"]);
  });

  it("moving the first goal up is a no-op boundary (up button disabled, no onReorder call)", () => {
    const onReorder = vi.fn();
    const goals = [
      makeGoal({ id: "1", name: "A", priority: 1 }),
      makeGoal({ id: "2", name: "B", priority: 2 }),
    ];
    render(<SavingsGoalList {...baseProps} goals={goals} onReorder={onReorder} />);
    const upButtons = screen.getAllByRole("button", { name: /subir/i });
    expect((upButtons[0] as HTMLButtonElement).disabled).toBe(true);
  });

  it("clicking down on the first goal calls onReorder with the swapped id order", () => {
    const onReorder = vi.fn();
    const goals = [
      makeGoal({ id: "1", name: "A", priority: 1 }),
      makeGoal({ id: "2", name: "B", priority: 2 }),
      makeGoal({ id: "3", name: "C", priority: 3 }),
    ];
    render(<SavingsGoalList {...baseProps} goals={goals} onReorder={onReorder} />);
    const downButtons = screen.getAllByRole("button", { name: /bajar/i });
    fireEvent.click(downButtons[0]);
    expect(onReorder).toHaveBeenCalledWith(["2", "1", "3"]);
  });

  it("clicking up on the last goal calls onReorder with the swapped id order", () => {
    const onReorder = vi.fn();
    const goals = [
      makeGoal({ id: "1", name: "A", priority: 1 }),
      makeGoal({ id: "2", name: "B", priority: 2 }),
      makeGoal({ id: "3", name: "C", priority: 3 }),
    ];
    render(<SavingsGoalList {...baseProps} goals={goals} onReorder={onReorder} />);
    const upButtons = screen.getAllByRole("button", { name: /subir/i });
    fireEvent.click(upButtons[2]);
    expect(onReorder).toHaveBeenCalledWith(["1", "3", "2"]);
  });

  it("disables the down button for the last goal and up button for the first goal", () => {
    const goals = [
      makeGoal({ id: "1", name: "A", priority: 1 }),
      makeGoal({ id: "2", name: "B", priority: 2 }),
    ];
    render(<SavingsGoalList {...baseProps} goals={goals} />);
    const upButtons = screen.getAllByRole("button", { name: /subir/i }) as HTMLButtonElement[];
    const downButtons = screen.getAllByRole("button", { name: /bajar/i }) as HTMLButtonElement[];
    expect(upButtons[0].disabled).toBe(true);
    expect(downButtons[1].disabled).toBe(true);
    expect(upButtons[1].disabled).toBe(false);
    expect(downButtons[0].disabled).toBe(false);
  });

  it("forwards onEdit/onDelete/onToggleDone to the underlying cards", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onToggleDone = vi.fn();
    const goal = makeGoal({ id: "1", name: "A" });
    render(
      <SavingsGoalList
        {...baseProps}
        goals={[goal]}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleDone={onToggleDone}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /marcar como hecha/i }));
    expect(onToggleDone).toHaveBeenCalledWith("1");
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(onDelete).toHaveBeenCalledWith("1");
    fireEvent.click(screen.getByTestId("savings-goal-card"));
    expect(onEdit).toHaveBeenCalledWith(goal);
  });
});
