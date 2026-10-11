import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { IncomeBudget } from "./IncomeBudget";
import type { IncomeComparison, IncomeSource } from "@/features/finance-v2/domain";

const sources: IncomeSource[] = [
  { id: "i1", name: "Sueldo", amount: 1_500_000 },
  { id: "i2", name: "Freelance", amount: 300_000 },
];

const comparison: IncomeComparison = {
  rows: [
    { id: "i1", name: "Sueldo", budgeted: 1_500_000, real: 1_000_000, difference: -500_000 },
    { id: "i2", name: "Freelance", budgeted: 300_000, real: 400_000, difference: 100_000 },
  ],
  unassigned: 0,
  total: { budgeted: 1_800_000, real: 1_400_000, difference: -400_000 },
};

const noop = () => {};
const handlers = { onAdd: noop, onRename: noop, onAmountBlur: noop, onDelete: noop };

const row = (name: string) => screen.getByText(name).closest("li") as HTMLElement;

describe("IncomeBudget — view mode", () => {
  it("shows each source's real income against its budget", () => {
    render(<IncomeBudget mode="view" sources={sources} income={comparison} {...handlers} />);

    expect(screen.getByRole("heading", { name: "Ingresos" })).toBeTruthy();
    const salary = within(row("Sueldo"));
    expect(salary.getByText("$1.000.000")).toBeTruthy();
    expect(salary.getByText("de $1.500.000 · faltan $500.000")).toBeTruthy();
    const freelance = within(row("Freelance"));
    expect(freelance.getByText("$400.000")).toBeTruthy();
    expect(freelance.getByText("de $300.000 · superado en $100.000")).toBeTruthy();
  });

  it("an exactly met source shows no shortfall or excess", () => {
    const met: IncomeComparison = {
      rows: [{ id: "i1", name: "Sueldo", budgeted: 5, real: 5, difference: 0 }],
      unassigned: 0,
      total: { budgeted: 5, real: 5, difference: 0 },
    };
    render(<IncomeBudget mode="view" sources={[sources[0]]} income={met} {...handlers} />);
    expect(within(row("Sueldo")).getByText("de $5")).toBeTruthy();
  });

  it("shows the total, and a \"Sin fuente\" row only when there is untagged income", () => {
    const { rerender } = render(
      <IncomeBudget mode="view" sources={sources} income={comparison} {...handlers} />
    );
    expect(screen.queryByText("Sin fuente")).toBeNull();
    const total = within(row("Total"));
    expect(total.getByText("$1.400.000")).toBeTruthy();
    expect(total.getByText("de $1.800.000 · faltan $400.000")).toBeTruthy();

    rerender(
      <IncomeBudget
        mode="view"
        sources={sources}
        income={{ ...comparison, unassigned: 25_000 }}
        {...handlers}
      />
    );
    expect(within(row("Sin fuente")).getByText("$25.000")).toBeTruthy();
  });

  it("with no sources and no income, says so instead of showing a table", () => {
    render(
      <IncomeBudget
        mode="view"
        sources={[]}
        income={{ rows: [], unassigned: 0, total: { budgeted: 0, real: 0, difference: 0 } }}
        {...handlers}
      />
    );
    expect(screen.getByText("No hay fuentes de ingreso")).toBeTruthy();
    expect(screen.queryByText("Total")).toBeNull();
  });

  it("while the month loads, shows placeholders instead of figures", () => {
    render(<IncomeBudget mode="view" sources={sources} income={null} {...handlers} />);
    expect(screen.queryByText(/\$/)).toBeNull();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("view mode has no edit controls", () => {
    render(<IncomeBudget mode="view" sources={sources} income={comparison} {...handlers} />);
    expect(screen.queryByLabelText("Monto de Sueldo")).toBeNull();
    expect(screen.queryByLabelText("Nombre de la fuente")).toBeNull();
  });
});

describe("IncomeBudget — edit mode", () => {
  it("blurring a source's amount reports the raw value with its id", () => {
    const onAmountBlur = vi.fn();
    render(
      <IncomeBudget
        mode="edit"
        sources={sources}
        income={comparison}
        {...handlers}
        onAmountBlur={onAmountBlur}
      />
    );

    const input = screen.getByLabelText("Monto de Sueldo") as HTMLInputElement;
    expect(input.value).toBe("1500000");
    fireEvent.change(input, { target: { value: "1600000" } });
    fireEvent.blur(input);
    expect(onAmountBlur).toHaveBeenCalledWith("i1", "1600000");
  });

  it("renames a source through the inline name field", () => {
    const onRename = vi.fn();
    render(
      <IncomeBudget mode="edit" sources={sources} income={comparison} {...handlers} onRename={onRename} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Freelance" }));
    const input = screen.getByDisplayValue("Freelance");
    fireEvent.change(input, { target: { value: "Clases" } });
    fireEvent.blur(input);
    expect(onRename).toHaveBeenCalledWith("i2", "Clases");
  });

  it("deletes a source", () => {
    const onDelete = vi.fn();
    render(
      <IncomeBudget mode="edit" sources={sources} income={comparison} {...handlers} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByLabelText("Eliminar fuente Sueldo"));
    expect(onDelete).toHaveBeenCalledWith("i1");
  });

  it("adds a source by name and clears the field; a blank name adds nothing", () => {
    const onAdd = vi.fn();
    render(<IncomeBudget mode="edit" sources={[]} income={comparison} {...handlers} onAdd={onAdd} />);

    const name = screen.getByLabelText("Nombre de la fuente") as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: "Agregar fuente" }));
    expect(onAdd).not.toHaveBeenCalled();

    fireEvent.change(name, { target: { value: "Sueldo" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar fuente" }));
    expect(onAdd).toHaveBeenCalledWith("Sueldo");
    expect(name.value).toBe("");
  });
});
