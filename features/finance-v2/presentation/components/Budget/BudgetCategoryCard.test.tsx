import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetCategoryCard } from "./BudgetCategoryCard";
import type { BudgetCategory } from "@/features/finance-v2/domain";

const leafCategory: BudgetCategory = {
  id: "c1",
  name: "Arriendo",
  bucket: "fixed",
  amount: 350_000,
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

const noop = () => {};

describe("BudgetCategoryCard", () => {
  it("leaf category renders an amount input and blur triggers onAmountBlur", () => {
    const onAmountBlur = vi.fn();
    render(
      <BudgetCategoryCard
        category={leafCategory}
        onAmountBlur={onAmountBlur}
        onDeleteCategory={noop}
        onAddSubcategory={noop}
        onDeleteSubcategory={noop}
      />
    );

    const input = screen.getByLabelText("Monto de Arriendo");
    fireEvent.blur(input, { target: { value: "400000" } });

    expect(onAmountBlur).toHaveBeenCalledWith("c1", null, "400000");
  });

  it("parent category renders NO direct amount input, a derived total, and one row per subcategory", () => {
    render(
      <BudgetCategoryCard
        category={parentCategory}
        onAmountBlur={noop}
        onDeleteCategory={noop}
        onAddSubcategory={noop}
        onDeleteSubcategory={noop}
      />
    );

    expect(screen.queryByLabelText("Monto de Servicios")).toBeNull();
    expect(screen.getByText("$8.000")).toBeTruthy(); // derived total: 5000 + 3000
    expect(screen.getByLabelText("Monto de Luz")).toBeTruthy();
    expect(screen.getByLabelText("Monto de Agua")).toBeTruthy();
  });

  it("subcategory amount blur triggers onAmountBlur with the subcategory id", () => {
    const onAmountBlur = vi.fn();
    render(
      <BudgetCategoryCard
        category={parentCategory}
        onAmountBlur={onAmountBlur}
        onDeleteCategory={noop}
        onAddSubcategory={noop}
        onDeleteSubcategory={noop}
      />
    );

    fireEvent.blur(screen.getByLabelText("Monto de Luz"), { target: { value: "6000" } });

    expect(onAmountBlur).toHaveBeenCalledWith("c2", "s1", "6000");
  });

  it("the add-subcategory bucket select defaults to the category's own stored bucket", () => {
    render(
      <BudgetCategoryCard
        category={parentCategory}
        onAmountBlur={noop}
        onDeleteCategory={noop}
        onAddSubcategory={noop}
        onDeleteSubcategory={noop}
      />
    );

    const select = screen.getByLabelText("Bucket de la subcategoría") as HTMLSelectElement;
    expect(select.value).toBe("fixed");
  });

  it("submitting the add-subcategory form calls onAddSubcategory and clears the name field", () => {
    const onAddSubcategory = vi.fn();
    render(
      <BudgetCategoryCard
        category={leafCategory}
        onAmountBlur={noop}
        onDeleteCategory={noop}
        onAddSubcategory={onAddSubcategory}
        onDeleteSubcategory={noop}
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
        category={parentCategory}
        onAmountBlur={noop}
        onDeleteCategory={noop}
        onAddSubcategory={noop}
        onDeleteSubcategory={onDeleteSubcategory}
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
          category={leafCategory}
          onAmountBlur={noop}
          onDeleteCategory={onDeleteCategory}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
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
          category={leafCategory}
          onAmountBlur={noop}
          onDeleteCategory={onDeleteCategory}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
        />
      );

      fireEvent.click(screen.getByLabelText("Eliminar categoría Arriendo"));

      expect(onDeleteCategory).toHaveBeenCalledWith("c1");
    });
  });
});
