import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SavingsGoalCard } from "./SavingsGoalCard";
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
  isFirst: false,
  isLast: false,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
  onToggleDone: vi.fn(),
};

describe("SavingsGoalCard", () => {
  it("applies the dimmed style when isDone is true", () => {
    render(<SavingsGoalCard {...baseProps} goal={makeGoal({ isDone: true })} />);
    const article = screen.getByTestId("savings-goal-card");
    expect(article.className).toContain("opacity-50");
    expect(article.getAttribute("aria-disabled")).toBe("true");
  });

  it("does NOT apply the dimmed style when isDone is false", () => {
    render(<SavingsGoalCard {...baseProps} goal={makeGoal({ isDone: false })} />);
    const article = screen.getByTestId("savings-goal-card");
    expect(article.className).not.toContain("opacity-50");
    expect(article.getAttribute("aria-disabled")).toBe("false");
  });

  it("disables the up button when isFirst is true", () => {
    render(<SavingsGoalCard {...baseProps} goal={makeGoal()} isFirst={true} />);
    const button = screen.getByRole("button", { name: /subir/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("disables the down button when isLast is true", () => {
    render(<SavingsGoalCard {...baseProps} goal={makeGoal()} isLast={true} />);
    const button = screen.getByRole("button", { name: /bajar/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("enables both reorder buttons when neither first nor last", () => {
    render(<SavingsGoalCard {...baseProps} goal={makeGoal()} isFirst={false} isLast={false} />);
    const up = screen.getByRole("button", { name: /subir/i }) as HTMLButtonElement;
    const down = screen.getByRole("button", { name: /bajar/i }) as HTMLButtonElement;
    expect(up.disabled).toBe(false);
    expect(down.disabled).toBe(false);
  });

  it("calls onMoveUp when the up button is clicked", () => {
    const onMoveUp = vi.fn();
    render(<SavingsGoalCard {...baseProps} goal={makeGoal()} onMoveUp={onMoveUp} />);
    fireEvent.click(screen.getByRole("button", { name: /subir/i }));
    expect(onMoveUp).toHaveBeenCalledOnce();
  });

  it("calls onMoveDown when the down button is clicked", () => {
    const onMoveDown = vi.fn();
    render(<SavingsGoalCard {...baseProps} goal={makeGoal()} onMoveDown={onMoveDown} />);
    fireEvent.click(screen.getByRole("button", { name: /bajar/i }));
    expect(onMoveDown).toHaveBeenCalledOnce();
  });

  it("calls onEdit with the goal when the card is clicked", () => {
    const onEdit = vi.fn();
    const goal = makeGoal();
    render(<SavingsGoalCard {...baseProps} goal={goal} onEdit={onEdit} />);
    fireEvent.click(screen.getByTestId("savings-goal-card"));
    expect(onEdit).toHaveBeenCalledWith(goal);
  });

  it("calls onDelete with the goal id when the delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<SavingsGoalCard {...baseProps} goal={makeGoal({ id: "goal-42" })} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(onDelete).toHaveBeenCalledWith("goal-42");
  });

  it("calls onToggleDone with the goal id when the done toggle is clicked", () => {
    const onToggleDone = vi.fn();
    render(
      <SavingsGoalCard
        {...baseProps}
        goal={makeGoal({ id: "goal-7", isDone: false })}
        onToggleDone={onToggleDone}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /marcar como hecha/i }));
    expect(onToggleDone).toHaveBeenCalledWith("goal-7");
  });

  it("shows a 'reopen' toggle state and aria-pressed=true when the goal is done", () => {
    render(<SavingsGoalCard {...baseProps} goal={makeGoal({ isDone: true })} />);
    const toggle = screen.getByRole("button", { name: /reabrir/i });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  it("shows aria-pressed=false when the goal is not done", () => {
    render(<SavingsGoalCard {...baseProps} goal={makeGoal({ isDone: false })} />);
    const toggle = screen.getByRole("button", { name: /marcar como hecha/i });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  it("renders progress=1 and currentAmount=targetAmount values as given for a done goal", () => {
    render(
      <SavingsGoalCard
        {...baseProps}
        goal={makeGoal({ isDone: true, currentAmount: 1000, targetAmount: 1000, progress: 1 })}
      />
    );
    expect(screen.getByText(/\$1.000 \/ \$1.000/)).toBeTruthy();
  });

  it("does not render reorder/delete/toggle-done controls when isOwner is false", () => {
    render(<SavingsGoalCard {...baseProps} goal={makeGoal()} isOwner={false} />);
    expect(screen.queryByRole("button", { name: /subir/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /bajar/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /marcar como hecha|reabrir/i })).toBeNull();
  });
});
