import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { BudgetCategoriesModal } from "./BudgetCategoriesModal";

// jsdom does not implement HTMLDialogElement.showModal / close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const groups = [
  { name: "Sueldo", type: "income" as const, categories: ["Peter"] },
  { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo", "Suscripciones"] },
  { name: "Devolución", type: "refund" as const, categories: ["Isapre"] },
];

describe("BudgetCategoriesModal", () => {
  it("renders all expense categories for the given month, excluding income/refund categories", () => {
    render(
      <BudgetCategoriesModal
        isOpen={true}
        onClose={vi.fn()}
        month="2026-07"
        groups={groups}
        excludedCategories={[]}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText("Arriendo", { selector: "*" })).toBeTruthy();
    expect(screen.getByText("Suscripciones", { selector: "*" })).toBeTruthy();
    expect(screen.queryByText("Peter")).toBeNull();
    expect(screen.queryByText("Isapre")).toBeNull();
  });

  it("shows the excluded state accurately from initialExcludedCategories", () => {
    render(
      <BudgetCategoriesModal
        isOpen={true}
        onClose={vi.fn()}
        month="2026-07"
        groups={groups}
        excludedCategories={["Suscripciones"]}
        onToggle={vi.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: /Suscripciones/, hidden: true }).getAttribute(
        "aria-pressed"
      )
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: /Arriendo/, hidden: true }).getAttribute("aria-pressed")
    ).toBe("false");
  });

  it("clicking a category's toggle calls onToggle(category)", () => {
    const onToggle = vi.fn();
    render(
      <BudgetCategoriesModal
        isOpen={true}
        onClose={vi.fn()}
        month="2026-07"
        groups={groups}
        excludedCategories={[]}
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Arriendo/, hidden: true }));
    expect(onToggle).toHaveBeenCalledWith("Arriendo");
  });

  it("closing the modal does not itself persist anything (only calls onClose)", () => {
    const onClose = vi.fn();
    const onToggle = vi.fn();
    render(
      <BudgetCategoriesModal
        isOpen={true}
        onClose={onClose}
        month="2026-07"
        groups={groups}
        excludedCategories={[]}
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Listo", hidden: true }));
    expect(onClose).toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });
});
