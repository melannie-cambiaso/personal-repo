import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSavingsGoals } from "./useSavingsGoals";
import type { SavingsGoal } from "@/features/savings/domain";
import { distributeToGoals } from "@/features/savings/domain";

const makeGoal = (overrides: Partial<SavingsGoal> = {}): SavingsGoal => ({
  id: crypto.randomUUID(),
  name: "Test Goal",
  targetAmount: 1000,
  priority: 1,
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const onSave = vi.fn();

describe("useSavingsGoals", () => {
  beforeEach(() => {
    onSave.mockReset();
  });

  it("initial state: distributed matches distributeToGoals, surplus correct", () => {
    const initialGoals = [
      makeGoal({
        id: "1",
        name: "Goal A",
        targetAmount: 500,
        priority: 1,
        createdAt: "2026-01-01T00:00:00Z",
      }),
      makeGoal({
        id: "2",
        name: "Goal B",
        targetAmount: 800,
        priority: 2,
        createdAt: "2026-01-02T00:00:00Z",
      }),
    ];
    const balance = 600;
    const { result } = renderHook(() => useSavingsGoals({ initialGoals, balance, onSave }));
    const expected = distributeToGoals(balance, initialGoals);
    expect(result.current.distributed).toEqual(expected.goals);
    expect(result.current.surplus).toBe(expected.surplus);
  });

  it("handleAdd appends goal, normalizes priorities, calls onSave", () => {
    const initialGoals = [
      makeGoal({
        id: "1",
        name: "Existing",
        targetAmount: 300,
        priority: 1,
        createdAt: "2026-01-01T00:00:00Z",
      }),
    ];
    const { result } = renderHook(() => useSavingsGoals({ initialGoals, balance: 0, onSave }));
    act(() => result.current.handleAdd({ name: "New Goal", targetAmount: 500 }));
    expect(result.current.distributed).toHaveLength(2);
    expect(result.current.distributed[1].name).toBe("New Goal");
    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0][0] as SavingsGoal[];
    expect(saved[0].priority).toBe(1);
    expect(saved[1].priority).toBe(2);
  });

  it("handleAdd with targetAmount <= 0 does nothing and does not call onSave", () => {
    const { result } = renderHook(() => useSavingsGoals({ initialGoals: [], balance: 0, onSave }));
    act(() => result.current.handleAdd({ name: "Invalid", targetAmount: 0 }));
    expect(result.current.distributed).toHaveLength(0);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("handleAdd with negative targetAmount does nothing and does not call onSave", () => {
    const { result } = renderHook(() => useSavingsGoals({ initialGoals: [], balance: 0, onSave }));
    act(() => result.current.handleAdd({ name: "Invalid", targetAmount: -100 }));
    expect(result.current.distributed).toHaveLength(0);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("handleEdit patches name and targetAmount, preserves id and createdAt, calls onSave", () => {
    const goal = makeGoal({
      id: "abc",
      name: "Old Name",
      targetAmount: 500,
      priority: 1,
      createdAt: "2026-01-01T00:00:00Z",
    });
    const { result } = renderHook(() =>
      useSavingsGoals({ initialGoals: [goal], balance: 0, onSave })
    );
    act(() => result.current.handleEdit("abc", { name: "New Name", targetAmount: 999 }));
    expect(result.current.distributed[0].name).toBe("New Name");
    expect(result.current.distributed[0].targetAmount).toBe(999);
    expect(result.current.distributed[0].id).toBe("abc");
    expect(result.current.distributed[0].createdAt).toBe("2026-01-01T00:00:00Z");
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("handleEdit with targetAmount <= 0 is a no-op and does not call onSave", () => {
    const goal = makeGoal({ id: "abc", targetAmount: 500 });
    const { result } = renderHook(() =>
      useSavingsGoals({ initialGoals: [goal], balance: 0, onSave })
    );
    act(() => result.current.handleEdit("abc", { name: "Name", targetAmount: -1 }));
    expect(result.current.distributed[0].targetAmount).toBe(500);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("handleDelete removes goal and repacks priorities as dense 1..n, calls onSave", () => {
    const goals = [
      makeGoal({ id: "1", name: "A", priority: 1, createdAt: "2026-01-01T00:00:00Z" }),
      makeGoal({ id: "2", name: "B", priority: 2, createdAt: "2026-01-02T00:00:00Z" }),
      makeGoal({ id: "3", name: "C", priority: 3, createdAt: "2026-01-03T00:00:00Z" }),
    ];
    const { result } = renderHook(() =>
      useSavingsGoals({ initialGoals: goals, balance: 0, onSave })
    );
    act(() => result.current.handleDelete("2"));
    expect(result.current.distributed).toHaveLength(2);
    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0][0] as SavingsGoal[];
    expect(saved[0].id).toBe("1");
    expect(saved[1].id).toBe("3");
    expect(saved[0].priority).toBe(1);
    expect(saved[1].priority).toBe(2);
  });

  it("handleReorder rebuilds array in new order, priorities become 1..n, calls onSave", () => {
    const goals = [
      makeGoal({ id: "1", name: "A", priority: 1, createdAt: "2026-01-01T00:00:00Z" }),
      makeGoal({ id: "2", name: "B", priority: 2, createdAt: "2026-01-02T00:00:00Z" }),
      makeGoal({ id: "3", name: "C", priority: 3, createdAt: "2026-01-03T00:00:00Z" }),
    ];
    const { result } = renderHook(() =>
      useSavingsGoals({ initialGoals: goals, balance: 0, onSave })
    );
    act(() => result.current.handleReorder(["3", "1", "2"]));
    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0][0] as SavingsGoal[];
    expect(saved[0].id).toBe("3");
    expect(saved[1].id).toBe("1");
    expect(saved[2].id).toBe("2");
    expect(saved[0].priority).toBe(1);
    expect(saved[1].priority).toBe(2);
    expect(saved[2].priority).toBe(3);
  });

  it("surplus reflects distributeToGoals result when balance exceeds all targets", () => {
    const goals = [
      makeGoal({ id: "1", targetAmount: 500, priority: 1, createdAt: "2026-01-01T00:00:00Z" }),
    ];
    const balance = 1200;
    const { result } = renderHook(() => useSavingsGoals({ initialGoals: goals, balance, onSave }));
    expect(result.current.surplus).toBe(700);
  });

  it("stale-ref safety: handleAdd then handleDelete both apply, onSave called twice", () => {
    const { result } = renderHook(() => useSavingsGoals({ initialGoals: [], balance: 0, onSave }));
    act(() => result.current.handleAdd({ name: "First", targetAmount: 100 }));
    const addedId = (onSave.mock.calls[0][0] as SavingsGoal[])[0].id;
    act(() => result.current.handleDelete(addedId));
    expect(result.current.distributed).toHaveLength(0);
    expect(onSave).toHaveBeenCalledTimes(2);
  });
});
