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

const noop = () => {};

describe("BudgetCategoryCard", () => {
  it("leaf category renders an amount input and blur triggers onAmountBlur", () => {
    const onAmountBlur = vi.fn();
    render(
      <BudgetCategoryCard
        mode="edit"
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
        mode="edit"
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
        mode="edit"
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
        mode="edit"
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
        mode="edit"
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
        mode="edit"
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
          mode="edit"
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
          mode="edit"
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

  describe("view mode", () => {
    it("leaf renders the formatted amount as text, not an input", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={leafCategory}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
        />
      );

      expect(screen.getByText("$350.000")).toBeTruthy();
      expect(screen.queryByLabelText("Monto de Arriendo")).toBeNull();
    });

    it("parent renders the total; subcategories start collapsed behind Ver más", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={parentCategory}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
        />
      );

      expect(screen.getByText("$8.000")).toBeTruthy();
      expect(screen.queryByText("$5.000")).toBeNull();
      expect(screen.queryByText("$3.000")).toBeNull();
      expect(screen.queryByText("Luz")).toBeNull();
      expect(screen.getByRole("button", { name: "Ver más" })).toBeTruthy();
    });

    it("clicking Ver más reveals subcategory names and amounts, and flips the label to Ver menos", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={parentCategory}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Ver más" }));

      expect(screen.getByText("Luz")).toBeTruthy();
      expect(screen.getByText("$5.000")).toBeTruthy();
      expect(screen.getByText("Agua")).toBeTruthy();
      expect(screen.getByText("$3.000")).toBeTruthy();
      expect(screen.queryByLabelText("Monto de Luz")).toBeNull();
      expect(screen.getByRole("button", { name: "Ver menos" })).toBeTruthy();
    });

    it("edit mode always shows every subcategory, with no Ver más/Ver menos toggle", () => {
      render(
        <BudgetCategoryCard
          mode="edit"
          category={parentCategory}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
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
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Ver más" }));

      expect(screen.queryByLabelText("Eliminar categoría Servicios")).toBeNull();
      expect(screen.queryByLabelText("Eliminar Luz")).toBeNull();
      expect(screen.queryByLabelText("Eliminar Agua")).toBeNull();
      expect(screen.queryByLabelText("Nombre de la subcategoría")).toBeNull();
    });

    it("a zero-amount leaf renders $0, not blank", () => {
      render(
        <BudgetCategoryCard
          mode="view"
          category={zeroLeafCategory}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
        />
      );

      expect(screen.getByText("$0")).toBeTruthy();
    });

    it("renders the header name identically to edit mode", () => {
      const { unmount } = render(
        <BudgetCategoryCard
          mode="edit"
          category={leafCategory}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
        />
      );
      expect(screen.getByText("Arriendo")).toBeTruthy();
      unmount();

      render(
        <BudgetCategoryCard
          mode="view"
          category={leafCategory}
          onAmountBlur={noop}
          onDeleteCategory={noop}
          onAddSubcategory={noop}
          onDeleteSubcategory={noop}
        />
      );
      expect(screen.getByText("Arriendo")).toBeTruthy();
    });
  });
});
