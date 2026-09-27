import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetCategoryCard } from "./BudgetCategoryCard";
import type { BudgetCategory } from "@/features/finance-v2/domain";
import type { SpendView } from "./spendView";

const leafCategory: BudgetCategory = {
  id: "c1",
  name: "Arriendo",
  bucket: "fixed",
  amount: 350_000,
  subcategories: [],
};

const zeroLeafCategory: BudgetCategory = {
  id: "c3",
  name: "Internet",
  bucket: "fixed",
  amount: 0,
  subcategories: [],
};

const parentCategory: BudgetCategory = {
  id: "c2",
  name: "Servicios",
  bucket: "fixed",
  amount: 0,
  subcategories: [
    { id: "s1", name: "Luz", bucket: "fixed", amount: 5000 },
    { id: "s2", name: "Agua", bucket: "variable", amount: 3000 },
  ],
};

const readySpend: SpendView = {
  status: "ready",
  comparison: {
    categories: {
      c1: { budgeted: 350_000, spent: 100_000 },
      c2: { budgeted: 0, spent: 7_000 },
      c3: { budgeted: 0, spent: 0 },
    },
    leaves: {
      c1: { budgeted: 350_000, spent: 100_000 },
      c3: { budgeted: 0, spent: 0 },
      s1: { budgeted: 5_000, spent: 6_000 },
      s2: { budgeted: 3_000, spent: 1_000 },
    },
    buckets: [
      { key: "fixed", budgeted: 0, spent: 0, unassigned: 0 },
      { key: "variable", budgeted: 0, spent: 0, unassigned: 0 },
      { key: "savings", budgeted: 0, spent: 0, unassigned: 0 },
    ],
    total: { budgeted: 0, spent: 0, unassigned: 0 },
  },
};

const loadingSpend: SpendView = { status: "loading" };

// A 4-Monday month (see `getWeeksInMonth`); every fixture here is monthly, so it
// does not change any figure.
const MONTH = "2026-09";

const noop = () => {};

describe("BudgetCategoryCard", () => {
  it("leaf category renders an amount input and blur triggers onAmountBlur", () => {
    const onAmountBlur = vi.fn();
    render(
      <BudgetCategoryCard
        mode="edit"
        category={leafCategory}
        month={MONTH}
        spend={readySpend}
        onAmountBlur={onAmountBlur}
        onDeleteCategory={noop}
        onAddSubcategory={noop}
        onDeleteSubcategory={noop}
        onFrequencyChange={noop}
      />
    );

    const input = screen.getByLabelText("Monto de Arriendo");
    fireEvent.blur(input, { target: { value: "400000" } });

    expect(onAmountBlur).toHaveBeenCalledWith("c1", null, "400000");
  });

  it("parent category renders NO direct amount input, a derived total, and one row per subcategory", () => {
    render(
      <BudgetCategoryCard
        mode="edit"
        category={parentCategory}
        month={MONTH}
        spend={readySpend}
        onAmountBlur={noop}
        onDeleteCategory={noop}
        onAddSubcategory={noop}
        onDeleteSubcategory={noop}
        onFrequencyChange={noop}
      />
    );

    expect(screen.queryByLabelText("Monto de Servicios")).toBeNull();
    expect(screen.getByText("$8.000")).toBeTruthy();
    expect(screen.getByLabelText("Monto de Luz")).toBeTruthy();
    expect(screen.getByLabelText("Monto de Agua")).toBeTruthy();
  });

  it("subcategory amount blur triggers onAmountBlur with the subcategory id", () => {
    const onAmountBlur = vi.fn();
    render(
      <BudgetCategoryCard
        mode="edit"
        category={parentCategory}
        month={MONTH}
        spend={readySpend}
        onAmountBlur={onAmountBlur}
        onDeleteCategory={noop}
        onAddSubcategory={noop}
        onDeleteSubcategory={noop}
        onFrequencyChange={noop}
      />
    );

    fireEvent.blur(screen.getByLabelText("Monto de Luz"), { target: { value: "6000" } });

    expect(onAmountBlur).toHaveBeenCalledWith("c2", "s1", "6000");
  });

  it("the add-subcategory bucket select defaults to the category's own stored bucket", () => {
    render(
      <BudgetCategoryCard
        mode="edit"
        category={parentCategory}
        month={MONTH}
        spend={readySpend}
        onAmountBlur={noop}
        onDeleteCategory={noop}
        onAddSubcategory={noop}
        onDeleteSubcategory={noop}
        onFrequencyChange={noop}
      />
    );

    const select = screen.getByLabelText("Bucket de la subcategoría") as HTMLSelectElement;
    expect(select.value).toBe("fixed");
  });

  it("submitting the add-subcategory form calls onAddSubcategory and clears the name field", () => {
    const onAddSubcategory = vi.fn();
    render(
      <BudgetCategoryCard
        mode="edit"
        category={leafCategory}
        month={MONTH}
        spend={readySpend}
        onAmountBlur={noop}
        onDeleteCategory={noop}
        onAddSubcategory={onAddSubcategory}
        onDeleteSubcategory={noop}
        onFrequencyChange={noop}
      />
    );

    fireEvent.change(screen.getByLabelText("Nombre de la subcategoría"), {
      target: { value: "Gas" },
    });
    fireEvent.click(screen.getByText("Agregar subcategoría"));

    expect(onAddSubcategory).toHaveBeenCalledWith("c1", "Gas", "fixed");
    expect((screen.getByLabelText("Nombre de la subcategoría") as HTMLInputElement).value).toBe("");
  });

  it("subcategory delete is immediate — no window.confirm call", () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    const onDeleteSubcategory = vi.fn();
    render(
      <BudgetCategoryCard
        mode="edit"
        category={parentCategory}
        month={MONTH}
        spend={readySpend}
        onAmountBlur={noop}
        onDeleteCategory={noop}
        onAddSubcategory={noop}
        onDeleteSubcategory={onDeleteSubcategory}
        onFrequencyChange={noop}
      />
    );

    fireEvent.click(screen.getByLabelText("Eliminar Luz"));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onDeleteSubcategory).toHaveBeenCalledWith("c2", "s1");
  });

  describe("category delete confirmation", () => {
    beforeEach(() => {
      vi.spyOn(window, "confirm");
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("calls window.confirm and aborts on cancel", () => {
      vi.mocked(window.confirm).mockReturnValue(false);
      const onDeleteCategory = vi.fn();
      render(
        <BudgetCategoryCard
          mode="edit"
          category={leafCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={onDeleteCategory}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      fireEvent.click(screen.getByLabelText("Eliminar categoría Arriendo"));

      expect(window.confirm).toHaveBeenCalledOnce();
      expect(onDeleteCategory).not.toHaveBeenCalled();
    });

    it("proceeds on confirm", () => {
      vi.mocked(window.confirm).mockReturnValue(true);
      const onDeleteCategory = vi.fn();
      render(
        <BudgetCategoryCard
          mode="edit"
          category={leafCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={onDeleteCategory}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      fireEvent.click(screen.getByLabelText("Eliminar categoría Arriendo"));

      expect(onDeleteCategory).toHaveBeenCalledWith("c1");
    });
  });

  describe("view mode", () => {
    it("leaf renders no amount input", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={leafCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.queryByLabelText("Monto de Arriendo")).toBeNull();
    });

    it("parent renders the total; subcategories start collapsed behind Ver más", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={parentCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.queryByText("Luz")).toBeNull();
      expect(screen.getByRole("button", { name: "Ver más" })).toBeTruthy();
    });

    it("clicking Ver más reveals subcategory names, and flips the label to Ver menos", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={parentCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Ver más" }));

      expect(screen.getByText("Luz")).toBeTruthy();
      expect(screen.getByText("Agua")).toBeTruthy();
      expect(screen.queryByLabelText("Monto de Luz")).toBeNull();
      expect(screen.getByRole("button", { name: "Ver menos" })).toBeTruthy();
    });

    it("edit mode always shows every subcategory, with no Ver más/Ver menos toggle", () => {
      render(
        <BudgetCategoryCard
          mode="edit"
          category={parentCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.getByLabelText("Monto de Luz")).toBeTruthy();
      expect(screen.getByLabelText("Monto de Agua")).toBeTruthy();
      expect(screen.queryByText("Ver más")).toBeNull();
      expect(screen.queryByText("Ver menos")).toBeNull();
    });

    it("hides delete-category, subcategory delete, and the add-subcategory form (subcategories expanded)", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={parentCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Ver más" }));

      expect(screen.queryByLabelText("Eliminar categoría Servicios")).toBeNull();
      expect(screen.queryByLabelText("Eliminar Luz")).toBeNull();
      expect(screen.queryByLabelText("Eliminar Agua")).toBeNull();
      expect(screen.queryByLabelText("Nombre de la subcategoría")).toBeNull();
    });

    it("renders the header name identically to edit mode", () => {
      const { unmount } = render(
        <BudgetCategoryCard
          mode="edit"
          category={leafCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );
      expect(screen.getByText("Arriendo")).toBeTruthy();
      unmount();

      render(
        <BudgetCategoryCard
          mode="view"
          category={leafCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );
      expect(screen.getByText("Arriendo")).toBeTruthy();
    });
  });

  describe("view mode spend pairing", () => {
    it("leaf pairs its actual spend against its budgeted amount", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={leafCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.getByText("$100.000")).toBeTruthy();
      expect(screen.getByText(/de \$350\.000/)).toBeTruthy();
    });

    it("a zero-spend leaf still shows $0, never hidden", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={zeroLeafCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.getByText("$0")).toBeTruthy();
    });

    it("parent header pairs the derived actual spend against the derived budgeted total", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={parentCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.getByText("$7.000")).toBeTruthy();
      expect(screen.getByText(/de \$8\.000/)).toBeTruthy();
    });

    it("an overrun subcategory shows the excedido suffix, a within-budget one does not", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={parentCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Ver más" }));

      expect(screen.getByText("$6.000")).toBeTruthy();
      expect(screen.getByText(/de \$5\.000 · excedido/)).toBeTruthy();
      expect(screen.getByText("$1.000")).toBeTruthy();
      expect(screen.getByText(/de \$3\.000/)).toBeTruthy();
      expect(screen.getAllByText(/excedido/)).toHaveLength(1);
    });

    it("edit mode never renders the spend pairing, even for a leaf or the parent-derived total", () => {
      render(
        <BudgetCategoryCard
          mode="edit"
          category={parentCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.queryByText(/de \$/)).toBeNull();
      expect(screen.getByText("$8.000")).toBeTruthy();
    });

    it("shows — instead of a false $0 while the month is still loading", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={leafCategory}
          month={MONTH}
          spend={loadingSpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.getByText("—")).toBeTruthy();
      expect(screen.queryByText("$100.000")).toBeNull();
      expect(screen.queryByText(/de \$/)).toBeNull();
    });

    it("parent header also shows — while loading, never a stale derived total", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={parentCategory}
          month={MONTH}
          spend={loadingSpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.getByText("—")).toBeTruthy();
      expect(screen.queryByText("$8.000")).toBeNull();
    });
  });

  // MONTH (2026-09) has 4 Mondays, so a weekly leaf budgets amount × 4.
  describe("frequency", () => {
    const weeklyLeaf: BudgetCategory = { ...leafCategory, name: "Comida", amount: 20_000, frequency: "weekly" };

    it("edit mode shows a frequency selector per leaf and changing it calls onFrequencyChange", () => {
      const onFrequencyChange = vi.fn();
      render(
        <BudgetCategoryCard
          mode="edit"
          category={leafCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={onFrequencyChange}
        />
      );

      const select = screen.getByLabelText("Frecuencia de Arriendo") as HTMLSelectElement;
      expect(select.value).toBe("monthly");

      fireEvent.change(select, { target: { value: "weekly" } });

      expect(onFrequencyChange).toHaveBeenCalledWith("c1", null, "weekly");
    });

    it("changing a subcategory's frequency passes its subcategoryId", () => {
      const onFrequencyChange = vi.fn();
      render(
        <BudgetCategoryCard
          mode="edit"
          category={parentCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={onFrequencyChange}
        />
      );

      fireEvent.change(screen.getByLabelText("Frecuencia de Luz"), { target: { value: "weekly" } });

      expect(onFrequencyChange).toHaveBeenCalledWith("c2", "s1", "weekly");
    });

    it("a weekly leaf shows its per-week meaning and the month total; a monthly leaf does not", () => {
      const { unmount } = render(
        <BudgetCategoryCard
          mode="edit"
          category={weeklyLeaf}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.getByText("por semana · × 4 semanas = $80.000")).toBeTruthy();
      unmount();

      render(
        <BudgetCategoryCard
          mode="edit"
          category={leafCategory}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.queryByText(/por semana/)).toBeNull();
    });

    it("a weekly subcategory shows its month total and the parent total is month-resolved", () => {
      const parentWithWeeklySub: BudgetCategory = {
        ...parentCategory,
        subcategories: [
          { id: "s1", name: "Luz", bucket: "fixed", amount: 5000, frequency: "weekly" },
          { id: "s2", name: "Agua", bucket: "variable", amount: 3000 },
        ],
      };
      render(
        <BudgetCategoryCard
          mode="edit"
          category={parentWithWeeklySub}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.getByText("por semana · × 4 semanas = $20.000")).toBeTruthy();
      expect(screen.getByText("$23.000")).toBeTruthy();
    });

    it("view mode never shows the frequency selector", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={weeklyLeaf}
          month={MONTH}
          spend={readySpend}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
          onFrequencyChange={noop}
        />
      );

      expect(screen.queryByLabelText(/Frecuencia de/)).toBeNull();
    });
  });
});
