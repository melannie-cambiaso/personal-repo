import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { FinanceV2Screen } from "./FinanceV2Screen";
import { DEFAULT_BUDGET_CONFIG } from "@/features/finance-v2/domain";
import type {
  BudgetConfig,
  EnvelopeConfig,
  FinanceV2Transaction,
} from "@/features/finance-v2/domain";
import { formatMonth } from "@/shared/utils/formatMonth";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const defaultProps = () => ({
  initialBudget: DEFAULT_BUDGET_CONFIG,
  onSaveBudget: vi.fn(),
  initialTransactions: [] as FinanceV2Transaction[],
  initialMonth: "2026-07",
  onSaveTransactions: vi.fn(),
  onSaveToOtherMonth: vi.fn(),
  onLoadTransactions: vi.fn().mockResolvedValue([]),
  initialEnvelopeConfig: null as EnvelopeConfig | null,
  initialCarriedIn: null as number | null,
  onSaveEnvelopeConfig: vi.fn(),
  onLoadEnvelopeCarriedBalance: vi.fn().mockResolvedValue(null),
});

describe("FinanceV2Screen", () => {
  it("defaults to the Presupuesto tab, showing the budget composition", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getAllByText("Fijos (0%)").length).toBeGreaterThan(0);
  });

  it("renders no Distribución tab or text", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.queryByText("Distribución")).toBeNull();
    expect(screen.getByText("Presupuesto")).toBeTruthy();
    expect(screen.queryByText("Pendientes")).toBeNull();
    expect(screen.getByText("Movimientos")).toBeTruthy();
    expect(screen.getByText("Análisis")).toBeTruthy();
  });

  describe("Análisis tab", () => {
    const budgetedProps = () => ({
      ...defaultProps(),
      initialBudget: {
        categories: [
          {
            id: "c1",
            name: "Arriendo",
            bucket: "fixed" as const,
            amount: 350_000,
            subcategories: [],
          },
        ],
      },
    });

    it("is reachable and replaces the Presupuesto view", () => {
      render(<FinanceV2Screen {...defaultProps()} />);

      fireEvent.click(screen.getByText("Análisis"));

      expect(screen.getByText("Resumen del mes")).toBeTruthy();
      expect(screen.queryByText("Fijos (0%)")).toBeNull();
    });

    // Proves the tab reads the LIVE hoisted budget config rather than analyzing an
    // empty one, which would report every figure as zero and look like it worked.
    it("summarizes the budget it was given", () => {
      render(<FinanceV2Screen {...budgetedProps()} />);

      fireEvent.click(screen.getByText("Análisis"));

      expect(screen.getByText("Presupuestado").nextSibling?.textContent).toBe("$350.000");
    });

    // The shared `MonthNav` drives every tab (design D6): the projection must follow
    // the month actually being viewed, not the month the screen was mounted with.
    // Awaited, not synchronous: changing the month puts the transaction hook into
    // its loading state, and the tab withholds the analysis until the new month's
    // transactions land rather than report a month with no spend.
    it("projects the month after the viewed one, not after the initial one", async () => {
      render(<FinanceV2Screen {...budgetedProps()} initialMonth="2026-07" />);

      fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));
      fireEvent.click(screen.getByText("Análisis"));
      expect(screen.getByText("Cargando el análisis del mes…")).toBeTruthy();

      const heading = await screen.findByText(/Próximo mes/);
      expect(heading.textContent).toContain(formatMonth("2026-09"));
    });
  });

  it("switches to the Movimientos tab, hiding the Presupuesto view", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Movimientos"));

    expect(screen.queryByText("Fijos (0%)")).toBeNull();
    expect(screen.getByText("Balance")).toBeTruthy();
  });

  it("preserves a budget category added on the Presupuesto tab after switching away and back", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nombre de la categoría"), {
      target: { value: "Arriendo" },
    });
    fireEvent.click(screen.getByText("Agregar categoría"));
    expect(screen.getByText("Arriendo")).toBeTruthy();

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.getByText("Arriendo")).toBeTruthy();
  });

  it("Presupuesto tab defaults to view mode", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(screen.queryByLabelText("Nombre de la categoría")).toBeNull();
  });

  it("mode survives Presupuesto → Movimientos → Presupuesto", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Nombre de la categoría")).toBeTruthy();

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.getByLabelText("Nombre de la categoría")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Listo" })).toBeTruthy();
  });

  it("mode persists across a category-list mutation", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nombre de la categoría"), {
      target: { value: "Arriendo" },
    });
    fireEvent.click(screen.getByText("Agregar categoría"));

    expect(screen.getByRole("button", { name: "Listo" })).toBeTruthy();
  });

  it("the Movimientos tab is reachable independently of the Presupuesto tab, without affecting its state", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Movimientos"));

    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.getByText(/no hay movimientos/i)).toBeTruthy();
  });

  it("a transaction added on the Movimientos tab survives switching away and back", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByText("Nuevo movimiento"));
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "1000" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    // "$1.000" appears three times: the balance total, its income breakdown figure, and the row's own amount.
    expect(screen.getAllByText("$1.000")).toHaveLength(3);
    expect(screen.getByLabelText("Eliminar movimiento de $1.000")).toBeTruthy();

    fireEvent.click(screen.getByText("Presupuesto"));
    fireEvent.click(screen.getByText("Movimientos"));

    expect(screen.getAllByText("$1.000")).toHaveLength(3);
    expect(screen.getByLabelText("Eliminar movimiento de $1.000")).toBeTruthy();
  });

  it("shows the shared MonthNav on first render, since Presupuesto is the default tab", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getByRole("button", { name: "← Anterior" })).toBeTruthy();
  });

  it("shows a single shared MonthNav on the Movimientos tab", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Movimientos"));

    expect(screen.getByRole("button", { name: "← Anterior" })).toBeTruthy();
  });

  it("switching the month from the shared MonthNav is reflected immediately when switching to the Presupuesto tab", () => {
    render(<FinanceV2Screen {...defaultProps()} initialMonth="2026-07" />);

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));

    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.getByText(formatMonth("2026-08"), { selector: "span" })).toBeTruthy();
  });

  it("clicking ← Anterior on the shared MonthNav decrements the viewed month", () => {
    render(<FinanceV2Screen {...defaultProps()} initialMonth="2026-07" />);

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByRole("button", { name: "← Anterior" }));

    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.getByText(formatMonth("2026-06"), { selector: "span" })).toBeTruthy();
  });

  it("opening the Add-Transaction modal disables the shared MonthNav (lifted isAddOpen guard)", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByText("Nuevo movimiento"));

    expect(
      (screen.getByRole("button", { name: "← Anterior" }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("a transaction filed to a different month via the picker calls onSaveToOtherMonth, stays absent from the current view, and shows the confirmation banner", () => {
    const onSaveToOtherMonth = vi.fn();
    const onSaveTransactions = vi.fn();
    render(
      <FinanceV2Screen
        {...defaultProps()}
        onSaveToOtherMonth={onSaveToOtherMonth}
        onSaveTransactions={onSaveTransactions}
      />
    );

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "1000" } });
    fireEvent.change(screen.getByLabelText("Mes"), { target: { value: "2026-08" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onSaveToOtherMonth).toHaveBeenCalledOnce();
    expect(onSaveTransactions).not.toHaveBeenCalled();
    expect(screen.queryByText(/no hay movimientos/i)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/Guardado en/);
  });
  describe("envelope wiring", () => {
    const envelope: EnvelopeConfig = {
      name: "Servicios",
      boundCategoryId: "cuentas",
      openingBalance: 0,
      openingMonth: "2026-07",
    };
    const cuentasWithLuz: BudgetConfig = {
      categories: [
        {
          id: "cuentas",
          name: "Cuentas",
          bucket: "fixed",
          amount: 0,
          subcategories: [{ id: "luz", name: "Luz", bucket: "fixed", amount: 50_000 }],
        },
        { id: "ocio", name: "Ocio", bucket: "variable", amount: 20_000, subcategories: [] },
      ],
    };

    const addExpense = (categoryId: string, month?: string) => {
      fireEvent.click(screen.getByText("Movimientos"));
      fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "43000" } });
      fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: categoryId } });
      if (month) fireEvent.change(screen.getByLabelText("Mes"), { target: { value: month } });
      fireEvent.click(screen.getByText("Agregar movimiento"));
    };

    const flush = () =>
      act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

    // Spec: "Paying the electricity bill".
    it("stamps an expense in a bound subcategory as envelope-paid", () => {
      const onSaveTransactions = vi.fn();
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudget={cuentasWithLuz}
          initialEnvelopeConfig={envelope}
          onSaveTransactions={onSaveTransactions}
        />
      );

      addExpense("luz");

      expect(onSaveTransactions).toHaveBeenCalledWith("2026-07", [
        expect.objectContaining({ type: "expense", paidFrom: "envelope" }),
      ]);
    });

    // Spec: "Expense outside the bound category".
    it("does not stamp an expense outside the bound category", () => {
      const onSaveTransactions = vi.fn();
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudget={cuentasWithLuz}
          initialEnvelopeConfig={envelope}
          onSaveTransactions={onSaveTransactions}
        />
      );

      addExpense("ocio");

      expect("paidFrom" in onSaveTransactions.mock.calls[0][1][0]).toBe(false);
    });

    it("does not stamp anything when no envelope is configured", () => {
      const onSaveTransactions = vi.fn();
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudget={cuentasWithLuz}
          onSaveTransactions={onSaveTransactions}
        />
      );

      addExpense("luz");

      expect("paidFrom" in onSaveTransactions.mock.calls[0][1][0]).toBe(false);
    });

    // The resolver must read the LIVE budget: "Luz" does not exist in the initial
    // budget, so a resolver bound to `initialBudget` would leave it unstamped.
    it("resolves funding against the live budget, including a subcategory added this session", () => {
      const onSaveTransactions = vi.fn();
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudget={{
            categories: [
              { id: "cuentas", name: "Cuentas", bucket: "fixed", amount: 0, subcategories: [] },
            ],
          }}
          initialEnvelopeConfig={envelope}
          onSaveTransactions={onSaveTransactions}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Editar" }));
      fireEvent.change(screen.getByLabelText("Nombre de la subcategoría"), {
        target: { value: "Luz" },
      });
      fireEvent.click(screen.getByText("Agregar subcategoría"));
      fireEvent.click(screen.getByText("Movimientos"));
      const categorySelect = screen.getByLabelText("Subcategoría") as HTMLSelectElement;
      const luzId = Array.from(categorySelect.options).find((o) => o.text === "Luz")!.value;

      addExpense(luzId);

      expect(onSaveTransactions).toHaveBeenCalledWith("2026-07", [
        expect.objectContaining({ paidFrom: "envelope" }),
      ]);
    });

    it("refreshes the carried-in balance after a save into an EARLIER month has landed", async () => {
      const onLoadEnvelopeCarriedBalance = vi.fn().mockResolvedValue(0);
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudget={cuentasWithLuz}
          initialEnvelopeConfig={{ ...envelope, openingMonth: "2026-05" }}
          initialCarriedIn={0}
          onSaveToOtherMonth={vi.fn().mockResolvedValue(undefined)}
          onLoadEnvelopeCarriedBalance={onLoadEnvelopeCarriedBalance}
        />
      );

      addExpense("luz", "2026-06");

      await waitFor(() => expect(onLoadEnvelopeCarriedBalance).toHaveBeenCalledWith("2026-07"));
    });

    // A later month can never feed the viewed month's carried-in balance.
    it("does not refresh the carried-in balance after a save into a LATER month", async () => {
      const onLoadEnvelopeCarriedBalance = vi.fn().mockResolvedValue(0);
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudget={cuentasWithLuz}
          initialEnvelopeConfig={envelope}
          initialCarriedIn={0}
          onSaveToOtherMonth={vi.fn().mockResolvedValue(undefined)}
          onLoadEnvelopeCarriedBalance={onLoadEnvelopeCarriedBalance}
        />
      );

      addExpense("luz", "2026-08");
      await flush();

      expect(onLoadEnvelopeCarriedBalance).not.toHaveBeenCalled();
    });

    it("loads the carried-in balance for the newly viewed month on navigation", async () => {
      const onLoadEnvelopeCarriedBalance = vi.fn().mockResolvedValue(0);
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialEnvelopeConfig={envelope}
          initialCarriedIn={0}
          onLoadEnvelopeCarriedBalance={onLoadEnvelopeCarriedBalance}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));

      await waitFor(() => expect(onLoadEnvelopeCarriedBalance).toHaveBeenCalledWith("2026-08"));
    });

    it("shows the envelope card with the server-loaded carried-in balance on the Movimientos tab", () => {
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudget={cuentasWithLuz}
          initialEnvelopeConfig={envelope}
          initialCarriedIn={7000}
        />
      );

      fireEvent.click(screen.getByText("Movimientos"));

      expect(screen.getByText("Saldo inicial del mes").nextSibling?.textContent).toBe("$7.000");
    });

    // Spec: `openingMonth` is set once, on creation, to the viewed month.
    it("creating the envelope from the Movimientos tab saves it with openingMonth = the viewed month", () => {
      const onSaveEnvelopeConfig = vi.fn();
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudget={{
            categories: [
              { id: "cuentas", name: "Cuentas", bucket: "fixed", amount: 0, subcategories: [] },
            ],
          }}
          onSaveEnvelopeConfig={onSaveEnvelopeConfig}
        />
      );

      fireEvent.click(screen.getByText("Movimientos"));
      fireEvent.click(screen.getByText("Configurar cuenta separada"));
      fireEvent.change(screen.getByLabelText("Nombre de la cuenta"), {
        target: { value: "Servicios" },
      });
      fireEvent.click(screen.getByText("Guardar cuenta"));

      expect(onSaveEnvelopeConfig).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Servicios", openingMonth: "2026-07" })
      );
    });

    it("opening the envelope config modal disables the shared MonthNav", () => {
      render(<FinanceV2Screen {...defaultProps()} initialBudget={cuentasWithLuz} />);

      fireEvent.click(screen.getByText("Movimientos"));
      fireEvent.click(screen.getByText("Configurar cuenta separada"));

      expect(
        (screen.getByRole("button", { name: "Siguiente →" }) as HTMLButtonElement).disabled
      ).toBe(true);
    });
  });
});
