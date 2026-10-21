import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { FinanceV2Screen } from "./FinanceV2Screen";
import { DEFAULT_BUDGET_CONFIG } from "@/features/finance-v2/domain";
import type {
  BudgetConfig,
  BudgetVersion,
  EnvelopeConfig,
  FinanceV2Transaction,
  SavingsFundConfig,
} from "@/features/finance-v2/domain";
import { formatMonth } from "@/shared/utils/formatMonth";

// The section lives in `?section=` (switched from the app menu), so the mock is a tiny
// external store: changing it re-renders the mounted screen, the same way a
// `history.pushState` does, which lets tests prove state survives a section switch.
const { searchParamsStore } = vi.hoisted(() => {
  let params = new URLSearchParams();
  const listeners = new Set<() => void>();
  return {
    searchParamsStore: {
      get: () => params,
      set: (next: URLSearchParams) => {
        params = next;
        listeners.forEach((l) => l());
      },
      subscribe: (l: () => void) => {
        listeners.add(l);
        return () => listeners.delete(l);
      },
    },
  };
});

vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  return {
    useSearchParams: () => useSyncExternalStore(searchParamsStore.subscribe, searchParamsStore.get),
  };
});

const SECTION_BY_LABEL = {
  Presupuesto: "budget",
  Resumen: "summary",
  Movimientos: "movements",
  Análisis: "analysis",
};
const goTo = (label: keyof typeof SECTION_BY_LABEL) =>
  act(() => searchParamsStore.set(new URLSearchParams({ section: SECTION_BY_LABEL[label] })));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

beforeEach(() => {
  searchParamsStore.set(new URLSearchParams());
});

const UPDATED_AT = "2026-01-01T00:00:00.000Z";
/** A single legacy version, so every month resolves to `config`. */
const seed = (config: BudgetConfig): BudgetVersion[] => [
  { effectiveFrom: "0000-00", config, updatedAt: UPDATED_AT },
];

const defaultProps = () => ({
  initialBudgetVersions: seed(DEFAULT_BUDGET_CONFIG),
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
  initialSavingsFundConfig: null as SavingsFundConfig | null,
  initialSavingsFundCarriedIn: null as number | null,
  onSaveSavingsFundConfig: vi.fn(),
  onLoadSavingsFundCarriedBalance: vi.fn().mockResolvedValue(null),
});

describe("FinanceV2Screen", () => {
  it("defaults to the Presupuesto tab, showing account coverage", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getByText("Pendiente por categoría")).toBeTruthy();
  });

  it("renders no Distribución tab or text", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.queryByText("Distribución")).toBeNull();
    expect(screen.queryByText("Pendientes")).toBeNull();
  });

  it("renders no in-page section switcher (sections live in the app menu)", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.queryByRole("button", { name: "Presupuesto" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Movimientos" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Análisis" })).toBeNull();
  });

  it("opens the section named by the param", () => {
    searchParamsStore.set(new URLSearchParams({ section: "summary" }));
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.queryByText("Pendiente por categoría")).toBeNull();
    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.queryByText(/no hay movimientos/i)).toBeNull();
  });

  it("the movements section shows the list, not the summary", () => {
    searchParamsStore.set(new URLSearchParams({ section: "movements" }));
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getByText(/no hay movimientos/i)).toBeTruthy();
    expect(screen.queryByText("Balance")).toBeNull();
  });

  it("falls back to Presupuesto for an unknown section param", () => {
    searchParamsStore.set(new URLSearchParams({ section: "nope" }));
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getByText("Pendiente por categoría")).toBeTruthy();
  });

  describe("Análisis tab", () => {
    const budgetedProps = () => ({
      ...defaultProps(),
      initialBudgetVersions: seed({
        categories: [
          {
            id: "c1",
            name: "Arriendo",
            bucket: "fixed" as const,
            amount: 350_000,
            subcategories: [],
          },
        ],
      }),
    });

    it("is reachable and replaces the Presupuesto view", () => {
      render(<FinanceV2Screen {...defaultProps()} />);

      goTo("Análisis");

      expect(screen.getByText("Resumen del mes")).toBeTruthy();
      expect(screen.queryByText("Pendiente por categoría")).toBeNull();
    });

    // Proves the tab reads the LIVE hoisted budget config rather than analyzing an
    // empty one, which would report every figure as zero and look like it worked.
    it("summarizes the budget it was given", () => {
      render(<FinanceV2Screen {...budgetedProps()} />);

      goTo("Análisis");

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
      goTo("Análisis");
      expect(screen.getByText("Cargando el análisis del mes…")).toBeTruthy();

      const heading = await screen.findByText(/Próximo mes/);
      expect(heading.textContent).toContain(formatMonth("2026-09"));
    });
  });

  it("switches to the Resumen tab, hiding the Presupuesto view", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    goTo("Resumen");

    expect(screen.queryByText("Pendiente por categoría")).toBeNull();
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

    goTo("Movimientos");
    goTo("Presupuesto");

    expect(screen.getByText("Arriendo")).toBeTruthy();
  });

  it("Presupuesto tab defaults to view mode", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(screen.queryByLabelText("Nombre de la categoría")).toBeNull();
  });

  describe("budget versions", () => {
    const category = (id: string, name: string) => ({
      id,
      name,
      bucket: "fixed" as const,
      amount: 100_000,
      subcategories: [],
    });
    // Comida was added in 2026-07 (the current month here), so June never had it.
    const versionedProps = () => ({
      ...defaultProps(),
      initialMonth: "2026-07",
      initialBudgetVersions: [
        {
          effectiveFrom: "0000-00",
          config: { categories: [category("c1", "Arriendo")] },
          updatedAt: UPDATED_AT,
        },
        {
          effectiveFrom: "2026-07",
          config: { categories: [category("c1", "Arriendo"), category("c2", "Comida")] },
          updatedAt: UPDATED_AT,
        },
      ],
    });
    const goPrev = () => fireEvent.click(screen.getByRole("button", { name: "← Anterior" }));
    const goNext = () => fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));

    it("shows each month the budget version in force for it", () => {
      render(<FinanceV2Screen {...versionedProps()} />);
      expect(screen.getByText("Comida")).toBeTruthy();

      goPrev();
      expect(screen.getByText("Arriendo")).toBeTruthy();
      expect(screen.queryByText("Comida")).toBeNull();

      goNext();
      goNext();
      expect(screen.getByText("Comida")).toBeTruthy();
    });

    it("offers a past month's own categories in the expense picker", () => {
      render(<FinanceV2Screen {...versionedProps()} />);

      goPrev();
      goTo("Movimientos");
      const options = Array.from(
        (screen.getByLabelText("Subcategoría") as HTMLSelectElement).options
      ).map((o) => o.text);

      expect(options).toContain("Arriendo");
      expect(options).not.toContain("Comida");
    });

    it("makes a past month read-only, forcing view mode even if edit mode was on", () => {
      render(<FinanceV2Screen {...versionedProps()} />);
      fireEvent.click(screen.getByRole("button", { name: "Editar" }));
      expect(screen.getByLabelText("Nombre de la categoría")).toBeTruthy();

      goPrev();

      expect(screen.getByText("Presupuesto de un mes cerrado: solo lectura")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Listo" })).toBeNull();
      expect(screen.queryByLabelText("Nombre de la categoría")).toBeNull();
    });

    it("keeps the current and future months editable", () => {
      render(<FinanceV2Screen {...versionedProps()} />);
      expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();

      goNext();

      expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
      expect(screen.queryByText("Presupuesto de un mes cerrado: solo lectura")).toBeNull();
    });

    it("saves an edit as the edited month's version and leaves earlier months untouched", () => {
      const props = versionedProps();
      render(<FinanceV2Screen {...props} />);

      goNext(); // 2026-08
      fireEvent.click(screen.getByRole("button", { name: "Editar" }));
      fireEvent.change(screen.getByLabelText("Nombre de la categoría"), {
        target: { value: "Ocio" },
      });
      fireEvent.click(screen.getByText("Agregar categoría"));

      expect(props.onSaveBudget).toHaveBeenCalledOnce();
      expect(props.onSaveBudget.mock.calls[0][0]).toBe("2026-08");
      expect(
        (props.onSaveBudget.mock.calls[0][1] as BudgetConfig).categories.map((c) => c.id)
      ).toEqual(expect.arrayContaining(["c1", "c2"]));

      goPrev(); // 2026-07 keeps its version
      expect(screen.queryByText("Ocio")).toBeNull();
      goNext();
      goNext(); // 2026-09 inherits the 2026-08 edit
      expect(screen.getByText("Ocio")).toBeTruthy();
    });
  });

  it("mode survives Presupuesto → Movimientos → Presupuesto", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Nombre de la categoría")).toBeTruthy();

    goTo("Movimientos");
    goTo("Presupuesto");

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

    goTo("Resumen");
    expect(screen.getByText("Balance")).toBeTruthy();

    goTo("Movimientos");
    expect(screen.getByText(/no hay movimientos/i)).toBeTruthy();
  });

  it("a transaction added on the Movimientos tab survives switching away and back", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    goTo("Movimientos");
    fireEvent.click(screen.getByText("Nuevo movimiento"));
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "1000" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    // The list view has no summary, so the amount appears once: the row's own figure.
    expect(screen.getAllByText("$1.000")).toHaveLength(1);
    expect(screen.getByLabelText("Eliminar movimiento de $1.000")).toBeTruthy();

    goTo("Presupuesto");
    goTo("Movimientos");

    expect(screen.getAllByText("$1.000")).toHaveLength(1);
    expect(screen.getByLabelText("Eliminar movimiento de $1.000")).toBeTruthy();

    // The summary view shows the balance total and its income breakdown figure.
    goTo("Resumen");
    expect(screen.getAllByText("$1.000")).toHaveLength(2);
  });

  it("shows the shared MonthNav on first render, since Presupuesto is the default tab", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getByRole("button", { name: "← Anterior" })).toBeTruthy();
  });

  it("shows a single shared MonthNav on the Movimientos tab", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    goTo("Movimientos");

    expect(screen.getByRole("button", { name: "← Anterior" })).toBeTruthy();
  });

  it("switching the month from the shared MonthNav is reflected immediately when switching to the Presupuesto tab", () => {
    render(<FinanceV2Screen {...defaultProps()} initialMonth="2026-07" />);

    goTo("Movimientos");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));

    goTo("Presupuesto");

    expect(screen.getByText(formatMonth("2026-08"), { selector: "span" })).toBeTruthy();
  });

  it("clicking ← Anterior on the shared MonthNav decrements the viewed month", () => {
    render(<FinanceV2Screen {...defaultProps()} initialMonth="2026-07" />);

    goTo("Movimientos");
    fireEvent.click(screen.getByRole("button", { name: "← Anterior" }));

    goTo("Presupuesto");

    expect(screen.getByText(formatMonth("2026-06"), { selector: "span" })).toBeTruthy();
  });

  it("opening the Add-Transaction modal disables the shared MonthNav (lifted isAddOpen guard)", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    goTo("Movimientos");
    fireEvent.click(screen.getByText("Nuevo movimiento"));

    expect((screen.getByRole("button", { name: "← Anterior" }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it("editing a listed transaction reuses the modal, guards the MonthNav and updates the row", () => {
    render(
      <FinanceV2Screen
        {...defaultProps()}
        initialTransactions={[
          { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
        ]}
      />
    );

    goTo("Movimientos");
    fireEvent.click(screen.getByRole("button", { name: "Editar movimiento de $1.000" }));

    expect(screen.getByText("Editar movimiento")).toBeTruthy();
    expect((screen.getByRole("button", { name: "← Anterior" }) as HTMLButtonElement).disabled).toBe(
      true
    );

    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "2500" } });
    fireEvent.click(screen.getByText("Guardar cambios"));

    expect(screen.getByLabelText("Eliminar movimiento de $2.500")).toBeTruthy();
    expect(screen.queryByLabelText("Eliminar movimiento de $1.000")).toBeNull();
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

    goTo("Movimientos");
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
      goTo("Movimientos");
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
          initialBudgetVersions={seed(cuentasWithLuz)}
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
          initialBudgetVersions={seed(cuentasWithLuz)}
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
          initialBudgetVersions={seed(cuentasWithLuz)}
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
          initialBudgetVersions={seed({
            categories: [
              { id: "cuentas", name: "Cuentas", bucket: "fixed", amount: 0, subcategories: [] },
            ],
          })}
          initialEnvelopeConfig={envelope}
          onSaveTransactions={onSaveTransactions}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Editar" }));
      fireEvent.change(screen.getByLabelText("Nombre de la subcategoría"), {
        target: { value: "Luz" },
      });
      fireEvent.click(screen.getByText("Agregar subcategoría"));
      goTo("Movimientos");
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
          initialBudgetVersions={seed(cuentasWithLuz)}
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
          initialBudgetVersions={seed(cuentasWithLuz)}
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

    it("shows the envelope card with the server-loaded carried-in balance on the Resumen tab", () => {
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudgetVersions={seed(cuentasWithLuz)}
          initialEnvelopeConfig={envelope}
          initialCarriedIn={7000}
        />
      );

      goTo("Resumen");

      expect(screen.getByText("Saldo inicial del mes").nextSibling?.textContent).toBe("$7.000");
    });

    // Spec: `openingMonth` is set once, on creation, to the viewed month.
    it("creating the envelope from the Resumen tab saves it with openingMonth = the viewed month", () => {
      const onSaveEnvelopeConfig = vi.fn();
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudgetVersions={seed({
            categories: [
              { id: "cuentas", name: "Cuentas", bucket: "fixed", amount: 0, subcategories: [] },
            ],
          })}
          onSaveEnvelopeConfig={onSaveEnvelopeConfig}
        />
      );

      goTo("Resumen");
      fireEvent.click(screen.getByText("Configurar cuenta separada"));
      fireEvent.change(screen.getByLabelText("Nombre de la cuenta"), {
        target: { value: "Servicios" },
      });
      fireEvent.click(screen.getByText("Guardar cuenta"));

      expect(onSaveEnvelopeConfig).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Servicios", openingMonth: "2026-07" })
      );
    });

    // Budget-tab account coverage: Luz is envelope-paid, so only Ocio's remaining
    // ($20.000 − $5.000) is pending from the main account; the balance is
    // $100.000 income − $5.000 main expense − $50.000 transfer (the envelope-paid
    // Luz expense never touches the main account).
    it("shows the viewed month's pending, balance and surplus on the Presupuesto tab", () => {
      const july = (tx: Record<string, unknown>) =>
        ({ date: "2026-07-05", month: "2026-07", ...tx }) as FinanceV2Transaction;
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudgetVersions={seed(cuentasWithLuz)}
          initialEnvelopeConfig={envelope}
          initialTransactions={[
            july({ id: "t1", type: "income", amount: 100_000 }),
            july({
              id: "t2",
              type: "expense",
              amount: 5_000,
              bucket: "variable",
              category: { id: "ocio", name: "Ocio" },
            }),
            july({
              id: "t3",
              type: "expense",
              amount: 43_000,
              bucket: "fixed",
              category: { id: "luz", name: "Luz" },
              paidFrom: "envelope",
            }),
            july({ id: "t4", type: "transfer", amount: 50_000 }),
          ]}
        />
      );

      expect(screen.getByText("Pendiente por categoría").nextSibling?.textContent).toBe("$15.000");
      expect(screen.getByText("Pendiente por subcategoría").nextSibling?.textContent).toBe(
        "$15.000"
      );
      expect(screen.getByText("Saldo del mes").nextSibling?.textContent).toBe("$45.000");
      expect(screen.getByText("Te sobran $30.000")).toBeTruthy();
      expect(screen.getByText("no incluye Cuentas: se paga desde Servicios")).toBeTruthy();
    });

    // Feria overspent by $10.000 nets against Super's $30.000 in the category figure
    // ($50.000 − $30.000), but clamps to 0 on its own in the subcategory figure, which
    // is the one the surplus subtracts ($70.000 − $30.000).
    it("nets an overspent subcategory in pending by category but not by subcategory", () => {
      const comida: BudgetConfig = {
        categories: [
          {
            id: "comida",
            name: "Comida",
            bucket: "variable",
            amount: 0,
            subcategories: [
              { id: "super", name: "Super", bucket: "variable", amount: 30_000 },
              { id: "feria", name: "Feria", bucket: "variable", amount: 20_000 },
            ],
          },
        ],
      };
      const july = (tx: Record<string, unknown>) =>
        ({ date: "2026-07-05", month: "2026-07", ...tx }) as FinanceV2Transaction;
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudgetVersions={seed(comida)}
          initialTransactions={[
            july({ id: "t1", type: "income", amount: 100_000 }),
            july({
              id: "t2",
              type: "expense",
              amount: 30_000,
              bucket: "variable",
              category: { id: "feria", name: "Feria" },
            }),
          ]}
        />
      );

      expect(screen.getByText("Pendiente por categoría").nextSibling?.textContent).toBe("$20.000");
      expect(screen.getByText("Pendiente por subcategoría").nextSibling?.textContent).toBe(
        "$30.000"
      );
      expect(screen.getByText("Te sobran $40.000")).toBeTruthy();
    });

    it("withholds the account coverage figures while a newly viewed month loads", () => {
      render(
        <FinanceV2Screen
          {...defaultProps()}
          initialBudgetVersions={seed(cuentasWithLuz)}
          initialEnvelopeConfig={envelope}
          onLoadTransactions={() => new Promise<FinanceV2Transaction[]>(() => {})}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));

      expect(screen.getByText("Pendiente por categoría").nextSibling?.textContent).toBe("—");
      expect(screen.getByText("Pendiente por subcategoría").nextSibling?.textContent).toBe("—");
      expect(screen.queryByText(/Te sobran|Te faltan/)).toBeNull();
    });

    it("opening the envelope config modal disables the shared MonthNav", () => {
      render(<FinanceV2Screen {...defaultProps()} initialBudgetVersions={seed(cuentasWithLuz)} />);

      goTo("Resumen");
      fireEvent.click(screen.getByText("Configurar cuenta separada"));

      expect(
        (screen.getByRole("button", { name: "Siguiente →" }) as HTMLButtonElement).disabled
      ).toBe(true);
    });
  });
});

describe("FinanceV2Screen — savings fund wiring", () => {
  const fund: SavingsFundConfig = {
    name: "Ahorros",
    openingBalance: 500_000,
    openingMonth: "2026-05",
  };

  it("shows the fund card with the server-loaded carried-in balance on the Resumen tab", () => {
    render(
      <FinanceV2Screen
        {...defaultProps()}
        initialSavingsFundConfig={fund}
        initialSavingsFundCarriedIn={480_000}
      />
    );

    goTo("Resumen");

    expect(screen.getByText("Retirado a la cuenta")).toBeTruthy();
    expect(screen.getByText("Saldo inicial del mes").nextSibling?.textContent).toBe("$480.000");
  });

  it("adds the viewed month's own deposits, withdrawals and fund-paid expenses to the card", () => {
    render(
      <FinanceV2Screen
        {...defaultProps()}
        initialSavingsFundConfig={fund}
        initialSavingsFundCarriedIn={480_000}
        initialTransactions={[
          { id: "d", type: "savings", amount: 50_000, date: "2026-07-01", month: "2026-07" },
          { id: "w", type: "withdrawal", amount: 20_000, date: "2026-07-02", month: "2026-07" },
          {
            id: "e",
            type: "expense",
            amount: 7_000,
            date: "2026-07-03",
            month: "2026-07",
            bucket: "variable",
            category: { id: "super", name: "Supermercado" },
            paidFrom: "savingsFund",
          },
        ]}
      />
    );

    goTo("Resumen");

    expect(screen.getByText("Depositado").nextSibling?.textContent).toBe("$50.000");
    expect(screen.getByText("Retirado a la cuenta").nextSibling?.textContent).toBe("$20.000");
    expect(screen.getByText("Gastado").nextSibling?.textContent).toBe("$7.000");
    expect(screen.getByText("Saldo").nextSibling?.textContent).toBe("$503.000");
  });

  it("shows no fund card and no fund load when no fund is configured", () => {
    const onLoadSavingsFundCarriedBalance = vi.fn().mockResolvedValue(0);
    render(
      <FinanceV2Screen
        {...defaultProps()}
        onLoadSavingsFundCarriedBalance={onLoadSavingsFundCarriedBalance}
      />
    );

    goTo("Movimientos");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));

    expect(screen.queryByText("Retirado a la cuenta")).toBeNull();
    expect(onLoadSavingsFundCarriedBalance).not.toHaveBeenCalled();
  });

  it("creating the fund saves it with openingMonth = the viewed month", () => {
    const onSaveSavingsFundConfig = vi.fn();
    render(
      <FinanceV2Screen {...defaultProps()} onSaveSavingsFundConfig={onSaveSavingsFundConfig} />
    );

    goTo("Resumen");
    fireEvent.click(screen.getByText("Configurar ahorros"));
    fireEvent.change(screen.getByLabelText("Nombre del fondo"), { target: { value: "Ahorros" } });
    fireEvent.change(screen.getByLabelText("Saldo inicial"), { target: { value: "500000" } });
    fireEvent.click(screen.getByText("Guardar ahorros"));

    expect(onSaveSavingsFundConfig).toHaveBeenCalledWith({
      name: "Ahorros",
      openingBalance: 500_000,
      openingMonth: "2026-07",
    });
  });

  it("re-fetches the fund's carried-in balance when the viewed month changes", async () => {
    const onLoadSavingsFundCarriedBalance = vi.fn().mockResolvedValue(0);
    render(
      <FinanceV2Screen
        {...defaultProps()}
        initialSavingsFundConfig={fund}
        initialSavingsFundCarriedIn={480_000}
        onLoadSavingsFundCarriedBalance={onLoadSavingsFundCarriedBalance}
      />
    );

    goTo("Movimientos");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));

    await waitFor(() => expect(onLoadSavingsFundCarriedBalance).toHaveBeenCalledWith("2026-08"));
  });

  it("opening the fund config modal disables the shared MonthNav", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    goTo("Resumen");
    fireEvent.click(screen.getByText("Configurar ahorros"));

    expect(
      (screen.getByRole("button", { name: "Siguiente →" }) as HTMLButtonElement).disabled
    ).toBe(true);
  });
});

describe("FinanceV2Screen — income budget", () => {
  const incomeProps = () => ({
    ...defaultProps(),
    initialBudgetVersions: seed({
      categories: [],
      incomeSources: [{ id: "i1", name: "Sueldo", amount: 1_500_000 }],
    }),
    initialTransactions: [
      {
        id: "t1",
        amount: 1_200_000,
        date: "2026-07-05",
        month: "2026-07",
        type: "income" as const,
        source: { id: "i1", name: "Sueldo" },
      },
      { id: "t2", amount: 30_000, date: "2026-07-06", month: "2026-07", type: "income" as const },
    ],
  });

  it("shows the viewed month's real income per source against its budget on Presupuesto", () => {
    render(<FinanceV2Screen {...incomeProps()} />);

    expect(screen.getByRole("heading", { name: "Ingresos" })).toBeTruthy();
    expect(screen.getByText("de $1.500.000 · faltan $300.000")).toBeTruthy();
    expect(screen.getByText("$30.000")).toBeTruthy(); // "Sin fuente"
    expect(screen.getByText("de $1.500.000 · faltan $270.000")).toBeTruthy(); // total
  });

  it("adding a source in edit mode saves it as the month's budget and survives a tab switch", () => {
    const props = defaultProps();
    render(<FinanceV2Screen {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nombre de la fuente"), {
      target: { value: "Freelance" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar fuente" }));

    expect(props.onSaveBudget).toHaveBeenCalledWith("2026-07", {
      categories: [],
      incomeSources: [{ id: expect.any(String), name: "Freelance", amount: 0 }],
    });

    goTo("Movimientos");
    goTo("Presupuesto");
    expect(screen.getByLabelText("Monto de Freelance")).toBeTruthy();
  });

  it("a past month shows its income read-only", () => {
    render(<FinanceV2Screen {...incomeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Nombre de la fuente")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Anterior/ }));

    expect(screen.queryByLabelText("Nombre de la fuente")).toBeNull();
    expect(screen.queryByLabelText("Monto de Sueldo")).toBeNull();
  });
});

describe("FinanceV2Screen — income source on Movimientos", () => {
  it("an income tagged with a budget source on Movimientos counts toward it on Presupuesto", () => {
    const props = {
      ...defaultProps(),
      initialBudgetVersions: seed({
        categories: [],
        incomeSources: [{ id: "i1", name: "Sueldo", amount: 1_500_000 }],
      }),
    };
    render(<FinanceV2Screen {...props} />);

    goTo("Movimientos");
    fireEvent.click(screen.getByText("Nuevo movimiento"));
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "500000" } });
    fireEvent.change(screen.getByLabelText("Fuente"), { target: { value: "i1" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(props.onSaveTransactions).toHaveBeenCalledWith("2026-07", [
      expect.objectContaining({ type: "income", source: { id: "i1", name: "Sueldo" } }),
    ]);

    goTo("Presupuesto");
    expect(screen.getAllByText("de $1.500.000 · faltan $1.000.000")).toHaveLength(2); // row + total
  });
});

describe("FinanceV2Screen — income on Análisis", () => {
  it("analyzes the viewed month's income against the live budget sources", () => {
    render(
      <FinanceV2Screen
        {...defaultProps()}
        initialBudgetVersions={seed({
          categories: [],
          incomeSources: [{ id: "i1", name: "Sueldo", amount: 1_500_000 }],
        })}
        initialTransactions={[
          {
            id: "t1",
            amount: 1_200_000,
            date: "2026-07-05",
            month: "2026-07",
            type: "income",
            source: { id: "i1", name: "Sueldo" },
          },
        ]}
      />
    );

    goTo("Análisis");

    expect(screen.getByText("Ingreso presupuestado").nextSibling?.textContent).toBe("$1.500.000");
    expect(screen.getByText("Ingreso real").nextSibling?.textContent).toBe("$1.200.000");
  });
});
