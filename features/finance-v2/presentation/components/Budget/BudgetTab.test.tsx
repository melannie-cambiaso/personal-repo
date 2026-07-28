import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetTab } from "./BudgetTab";
import { computeBudgetComparison, DEFAULT_BUDGET_CONFIG } from "@/features/finance-v2/domain";
import type { BudgetCategory, SplitResult } from "@/features/finance-v2/domain";
import type { SpendView } from "./spendView";

const validSplit: SplitResult = {
  status: "valid",
  buckets: [
    { key: "fixed", percentage: 50, amount: 500_000 },
    { key: "variable", percentage: 30, amount: 300_000 },
    { key: "savings", percentage: 20, amount: 200_000 },
  ],
};

const invalidSplit: SplitResult = {
  status: "invalid",
  reason: "percentages-must-sum-to-100",
  totalPercentage: 110,
};

const emptySpend: SpendView = {
  status: "ready",
  comparison: {
    categories: {},
    leaves: {},
    buckets: [
      { key: "fixed", budgeted: 0, spent: 0, unassigned: 0 },
      { key: "variable", budgeted: 0, spent: 0, unassigned: 0 },
      { key: "savings", budgeted: 0, spent: 0, unassigned: 0 },
    ],
    total: { budgeted: 0, spent: 0, unassigned: 0 },
  },
};

const loadingSpend: SpendView = { status: "loading" };

const noop = () => {};

describe("BudgetTab", () => {
  it("empty state in edit mode renders the comparison row plus an add-category affordance (name + bucket)", () => {
    render(
      <BudgetTab
        mode="edit"
        onToggleMode={noop}
        categories={[]}
        comparison={computeBudgetComparison(DEFAULT_BUDGET_CONFIG, validSplit)}
        spend={emptySpend}
        onAmountBlur={noop}
        onAddCategory={noop}
        onAddSubcategory={noop}
        onDeleteCategory={noop}
        onDeleteSubcategory={noop}
      />
    );

    expect(screen.getAllByText("Fijos").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Nombre de la categoría")).toBeTruthy();
    expect(screen.getByLabelText("Bucket de la categoría")).toBeTruthy();
  });

  it("empty categories renders the toggle in both view and edit mode", () => {
    const { unmount } = render(
      <BudgetTab
        mode="view"
        onToggleMode={noop}
        categories={[]}
        comparison={computeBudgetComparison(DEFAULT_BUDGET_CONFIG, validSplit)}
        spend={emptySpend}
        onAmountBlur={noop}
        onAddCategory={noop}
        onAddSubcategory={noop}
        onDeleteCategory={noop}
        onDeleteSubcategory={noop}
      />
    );
    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
    unmount();

    render(
      <BudgetTab
        mode="edit"
        onToggleMode={noop}
        categories={[]}
        comparison={computeBudgetComparison(DEFAULT_BUDGET_CONFIG, validSplit)}
        spend={emptySpend}
        onAmountBlur={noop}
        onAddCategory={noop}
        onAddSubcategory={noop}
        onDeleteCategory={noop}
        onDeleteSubcategory={noop}
      />
    );
    expect(screen.getByRole("button", { name: "Listo" })).toBeTruthy();
  });

  it("view mode with empty categories renders an explicit empty message and no add-category form", () => {
    render(
      <BudgetTab
        mode="view"
        onToggleMode={noop}
        categories={[]}
        comparison={computeBudgetComparison(DEFAULT_BUDGET_CONFIG, validSplit)}
        spend={emptySpend}
        onAmountBlur={noop}
        onAddCategory={noop}
        onAddSubcategory={noop}
        onDeleteCategory={noop}
        onDeleteSubcategory={noop}
      />
    );

    expect(screen.getByText("No hay categorías cargadas")).toBeTruthy();
    expect(screen.queryByLabelText("Nombre de la categoría")).toBeNull();
  });

  it("the toggle label and aria-pressed reflect mode, and clicking it calls onToggleMode once", () => {
    const onToggleMode = vi.fn();
    render(
      <BudgetTab
        mode="view"
        onToggleMode={onToggleMode}
        categories={[]}
        comparison={computeBudgetComparison(DEFAULT_BUDGET_CONFIG, validSplit)}
        spend={emptySpend}
        onAmountBlur={noop}
        onAddCategory={noop}
        onAddSubcategory={noop}
        onDeleteCategory={noop}
        onDeleteSubcategory={noop}
      />
    );

    const toggle = screen.getByRole("button", { name: "Editar" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggle);

    expect(onToggleMode).toHaveBeenCalledOnce();
  });

  it("degrades to budget-only comparison when the split is invalid", () => {
    render(
      <BudgetTab
        mode="view"
        onToggleMode={noop}
        categories={[]}
        comparison={computeBudgetComparison(DEFAULT_BUDGET_CONFIG, invalidSplit)}
        spend={emptySpend}
        onAmountBlur={noop}
        onAddCategory={noop}
        onAddSubcategory={noop}
        onDeleteCategory={noop}
        onDeleteSubcategory={noop}
      />
    );

    // No split "target" copy leaks through — the "de $" spend-pairing suffix is a
    // separate, unrelated concern (design D1) and is expected to still render.
    expect(screen.queryByText(/de \$1\.100\.000/)).toBeNull();
  });

  it("renders one BudgetCategoryCard per category and clears the form on submit", () => {
    const onAddCategory = vi.fn();
    render(
      <BudgetTab
        mode="edit"
        onToggleMode={noop}
        categories={[]}
        comparison={computeBudgetComparison(DEFAULT_BUDGET_CONFIG, validSplit)}
        spend={emptySpend}
        onAmountBlur={noop}
        onAddCategory={onAddCategory}
        onAddSubcategory={noop}
        onDeleteCategory={noop}
        onDeleteSubcategory={noop}
      />
    );

    fireEvent.change(screen.getByLabelText("Nombre de la categoría"), {
      target: { value: "Arriendo" },
    });
    fireEvent.click(screen.getByText("Agregar categoría"));

    expect(onAddCategory).toHaveBeenCalledWith("Arriendo", "fixed");
    expect((screen.getByLabelText("Nombre de la categoría") as HTMLInputElement).value).toBe("");
  });

  it("a blank category name does nothing and does not call onAddCategory", () => {
    const onAddCategory = vi.fn();
    render(
      <BudgetTab
        mode="edit"
        onToggleMode={noop}
        categories={[]}
        comparison={computeBudgetComparison(DEFAULT_BUDGET_CONFIG, validSplit)}
        spend={emptySpend}
        onAmountBlur={noop}
        onAddCategory={onAddCategory}
        onAddSubcategory={noop}
        onDeleteCategory={noop}
        onDeleteSubcategory={noop}
      />
    );

    fireEvent.click(screen.getByText("Agregar categoría"));

    expect(onAddCategory).not.toHaveBeenCalled();
  });

  it("renders an existing category as a BudgetCategoryCard whose amount blur delegates to onAmountBlur", () => {
    const category: BudgetCategory = {
      id: "c1",
      name: "Arriendo",
      bucket: "fixed",
      amount: 0,
      subcategories: [],
    };
    const onAmountBlur = vi.fn();
    render(
      <BudgetTab
        mode="edit"
        onToggleMode={noop}
        categories={[category]}
        comparison={computeBudgetComparison({ categories: [category] }, validSplit)}
        spend={emptySpend}
        onAmountBlur={onAmountBlur}
        onAddCategory={noop}
        onAddSubcategory={noop}
        onDeleteCategory={noop}
        onDeleteSubcategory={noop}
      />
    );

    fireEvent.blur(screen.getByLabelText("Monto de Arriendo"), { target: { value: "400000" } });

    expect(onAmountBlur).toHaveBeenCalledWith("c1", null, "400000");
  });

  describe("spend threading", () => {
    const category: BudgetCategory = {
      id: "c1",
      name: "Arriendo",
      bucket: "fixed",
      amount: 350_000,
      subcategories: [],
    };
    const spendWithData: SpendView = {
      status: "ready",
      comparison: {
        categories: { c1: { budgeted: 350_000, spent: 100_000 } },
        leaves: { c1: { budgeted: 350_000, spent: 100_000 } },
        buckets: [
          { key: "fixed", budgeted: 350_000, spent: 100_000, unassigned: 0 },
          { key: "variable", budgeted: 0, spent: 0, unassigned: 0 },
          { key: "savings", budgeted: 0, spent: 0, unassigned: 0 },
        ],
        total: { budgeted: 350_000, spent: 100_000, unassigned: 0 },
      },
    };

    it("threads spend into BucketComparison's actual-spend column", () => {
      render(
        <BudgetTab
          mode="view"
          onToggleMode={noop}
          categories={[category]}
          comparison={computeBudgetComparison({ categories: [category] }, validSplit)}
          spend={spendWithData}
          onAmountBlur={noop}
          onAddCategory={noop}
          onAddSubcategory={noop}
          onDeleteCategory={noop}
          onDeleteSubcategory={noop}
        />
      );

      expect(screen.getAllByText("$100.000").length).toBeGreaterThan(0);
    });

    it("threads spend into each BudgetCategoryCard's view-mode pairing", () => {
      render(
        <BudgetTab
          mode="view"
          onToggleMode={noop}
          categories={[category]}
          comparison={computeBudgetComparison({ categories: [category] }, validSplit)}
          spend={spendWithData}
          onAmountBlur={noop}
          onAddCategory={noop}
          onAddSubcategory={noop}
          onDeleteCategory={noop}
          onDeleteSubcategory={noop}
        />
      );

      expect(screen.getAllByText(/de \$350\.000/).length).toBeGreaterThan(0);
    });

    it("threads a loading spend down to both children, showing — instead of a figure", () => {
      render(
        <BudgetTab
          mode="view"
          onToggleMode={noop}
          categories={[category]}
          comparison={computeBudgetComparison({ categories: [category] }, validSplit)}
          spend={loadingSpend}
          onAmountBlur={noop}
          onAddCategory={noop}
          onAddSubcategory={noop}
          onDeleteCategory={noop}
          onDeleteSubcategory={noop}
        />
      );

      expect(screen.getAllByText("—").length).toBeGreaterThan(1);
      expect(screen.queryByText("$100.000")).toBeNull();
    });
  });
});
