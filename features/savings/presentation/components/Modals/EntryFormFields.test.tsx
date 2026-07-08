import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntryFormFields } from "./EntryFormFields";
import type { SavingsGoal } from "@/features/savings/domain";

type EntryField = "amount" | "date" | "notes" | "toReplenish" | "goalId";

const baseForm = { amount: "", date: "2026-01-01", notes: "", toReplenish: false, goalId: "" };

const makeGoal = (overrides: Partial<SavingsGoal> = {}): SavingsGoal => ({
  id: "1",
  name: "Goal",
  targetAmount: 1000,
  priority: 1,
  createdAt: "2026-01-01T00:00:00Z",
  isDone: false,
  ...overrides,
});

function Harness({
  showReplenish,
  goals,
  showGoalSelector,
}: {
  showReplenish: boolean;
  goals?: SavingsGoal[];
  showGoalSelector?: boolean;
}) {
  const [form, setForm] = useState(baseForm);
  const setField =
    (field: EntryField) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = field === "toReplenish" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  return (
    <EntryFormFields
      form={form}
      showReplenish={showReplenish}
      setField={setField}
      amountPlaceholder="0"
      goals={goals}
      showGoalSelector={showGoalSelector}
      onGoalChange={setField("goalId")}
    />
  );
}

describe("EntryFormFields", () => {
  it("renders amount, date, and notes fields", () => {
    render(<Harness showReplenish={false} />);
    expect(screen.getByLabelText("Monto * ($)")).toBeTruthy();
    expect(screen.getByLabelText("Fecha *")).toBeTruthy();
    expect(screen.getByLabelText("Notas")).toBeTruthy();
  });

  it("hides the replenish checkbox when showReplenish is false", () => {
    render(<Harness showReplenish={false} />);
    expect(screen.queryByText("A reponer este mes")).toBeNull();
  });

  it("shows the replenish checkbox when showReplenish is true", () => {
    render(<Harness showReplenish={true} />);
    expect(screen.getByText("A reponer este mes")).toBeTruthy();
  });

  it("lets the user type an amount and a date", () => {
    render(<Harness showReplenish={false} />);
    fireEvent.change(screen.getByLabelText("Monto * ($)"), { target: { value: "1000" } });
    fireEvent.change(screen.getByLabelText("Fecha *"), { target: { value: "2026-02-14" } });
    expect((screen.getByLabelText("Monto * ($)") as HTMLInputElement).value).toBe("1000");
    expect((screen.getByLabelText("Fecha *") as HTMLInputElement).value).toBe("2026-02-14");
  });

  describe("goal selector", () => {
    const goals = [
      makeGoal({ id: "1", name: "Goal A", isDone: false }),
      makeGoal({ id: "2", name: "Goal B", isDone: true }),
      makeGoal({ id: "3", name: "Goal C", isDone: false }),
    ];

    it("is hidden when showGoalSelector is false", () => {
      render(<Harness showReplenish={false} goals={goals} showGoalSelector={false} />);
      expect(screen.queryByLabelText("Meta")).toBeNull();
    });

    it("is hidden when showGoalSelector is true but no goals are provided", () => {
      render(<Harness showReplenish={false} goals={[]} showGoalSelector={true} />);
      expect(screen.queryByLabelText("Meta")).toBeNull();
    });

    it("lists only goals with isDone !== true when shown", () => {
      render(<Harness showReplenish={false} goals={goals} showGoalSelector={true} />);
      const select = screen.getByLabelText("Meta") as HTMLSelectElement;
      const optionLabels = Array.from(select.options).map((o) => o.textContent);
      expect(optionLabels).toContain("Goal A");
      expect(optionLabels).toContain("Goal C");
      expect(optionLabels).not.toContain("Goal B");
    });

    it("updates form state when a goal is selected", () => {
      render(<Harness showReplenish={false} goals={goals} showGoalSelector={true} />);
      const select = screen.getByLabelText("Meta") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "3" } });
      expect(select.value).toBe("3");
    });
  });
});
