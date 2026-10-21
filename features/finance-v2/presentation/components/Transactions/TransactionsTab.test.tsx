import type { ComponentProps } from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { TransactionsTab } from "./TransactionsTab";
import type { EnvelopeView } from "./Envelope/envelopeView";
import type { SavingsFundView } from "./SavingsFund/savingsFundView";
import type {
  DayGroup,
  ExpenseCategoryOption,
  TransactionTotals,
} from "@/features/finance-v2/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

type Props = ComponentProps<typeof TransactionsTab>;

describe("TransactionsTab", () => {
  const totals: TransactionTotals = {
    income: 1000,
    expense: 400,
    savings: 250,
    transfer: 0,
    withdrawn: 0,
    balance: 350,
  };
  const categoryOptions: ExpenseCategoryOption[] = [];

  const tabProps = (overrides: Partial<Props> = {}): Props => ({
    view: "summary",
    viewedMonth: "2026-07",
    lastCrossMonthSave: null,
    onDismissCrossMonthSave: vi.fn(),
    totals,
    dayGroups: [],
    categoryOptions,
    onAdd: vi.fn(),
    onDelete: vi.fn(),
    onUpdate: vi.fn(),
    onEdit: vi.fn(),
    editingTransaction: null,
    isAddOpen: false,
    onOpenAdd: vi.fn(),
    onCloseAdd: vi.fn(),
    envelope: null,
    budgetCategories: [],
    onSaveEnvelopeConfig: vi.fn(),
    isEnvelopeConfigOpen: false,
    onOpenEnvelopeConfig: vi.fn(),
    onCloseEnvelopeConfig: vi.fn(),
    savingsFund: null,
    onSaveSavingsFundConfig: vi.fn(),
    isSavingsFundConfigOpen: false,
    onOpenSavingsFundConfig: vi.fn(),
    onCloseSavingsFundConfig: vi.fn(),
    ...overrides,
  });

  const renderTab = (overrides: Partial<Props> = {}) =>
    render(<TransactionsTab {...tabProps(overrides)} />);

  const envelope: EnvelopeView = {
    config: {
      name: "Servicios",
      boundCategoryId: "cuentas",
      openingBalance: 0,
      openingMonth: "2026-07",
    },
    carriedIn: 7_000,
    flows: { transferred: 0, paid: 0 },
    suggestedTransfer: 116_000,
  };

  const savingsFund: SavingsFundView = {
    config: { name: "Ahorros", openingBalance: 500_000, openingMonth: "2026-07" },
    carriedIn: 480_000,
    flows: { deposited: 0, withdrawn: 0, spent: 0 },
  };

  it("wires the summary — shows balance and savings from the given totals", () => {
    renderTab();

    // "Ahorro" also appears as a select option in the wired form, so the summary's own
    // "Ahorro" label is asserted in MovementSummary.test.tsx instead — here we only need
    // to confirm the totals passed through. Savings intentionally renders twice (breakdown
    // segment + Ahorro row), so its formatted amount is disambiguated via getAllByText
    // rather than the plain getByText used for Balance.
    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.getByText("$350")).toBeTruthy();
    expect(screen.getAllByText("$250")).toHaveLength(2);
  });

  it("wires the form — submitting calls onAdd with the entered transaction", () => {
    const onAdd = vi.fn();
    renderTab({ onAdd, isAddOpen: true });

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "500" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ type: "income", amount: 500 }));
  });

  it("wires the list — clicking delete on a rendered row calls onDelete with that transaction's id", () => {
    const onDelete = vi.fn();
    const dayGroups: DayGroup[] = [
      {
        date: "2026-07-01",
        transactions: [
          { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
        ],
      },
    ];

    renderTab({ view: "list", dayGroups, onDelete });

    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(onDelete).toHaveBeenCalledWith("t1");
  });

  it("shows the empty-state message from the list when there are no transactions", () => {
    renderTab({ view: "list" });

    expect(screen.getByText(/no hay movimientos/i)).toBeTruthy();
  });

  it("shows no confirmation banner when lastCrossMonthSave is null", () => {
    renderTab();

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows a dismissible confirmation banner naming the destination month when lastCrossMonthSave is set", () => {
    renderTab({ lastCrossMonthSave: "2026-08" });

    const banner = screen.getByRole("status");
    expect(banner.textContent).toMatch(/Guardado en/);
    expect(banner.textContent).toMatch(/agosto/i);
  });

  it("dismissing the banner calls onDismissCrossMonthSave", () => {
    const onDismissCrossMonthSave = vi.fn();
    renderTab({ lastCrossMonthSave: "2026-08", onDismissCrossMonthSave });

    fireEvent.click(screen.getByLabelText("Cerrar aviso"));

    expect(onDismissCrossMonthSave).toHaveBeenCalledOnce();
  });

  it("clicking 'Nuevo movimiento' calls onOpenAdd instead of owning its own open state", () => {
    const onOpenAdd = vi.fn();
    renderTab({ view: "list", onOpenAdd });

    fireEvent.click(screen.getByText("Nuevo movimiento"));

    expect(onOpenAdd).toHaveBeenCalledOnce();
  });

  it("renders the Add-Transaction modal open when isAddOpen is true, without any internal open state", () => {
    renderTab({ isAddOpen: true });

    expect(screen.getByLabelText("Tipo de movimiento")).toBeTruthy();
  });

  it("closing the Add-Transaction modal calls onCloseAdd", () => {
    const onCloseAdd = vi.fn();
    renderTab({ isAddOpen: true, onCloseAdd });

    // Both modals' <dialog>s are always mounted, so scope to the Add-Transaction one.
    const addDialog = screen.getByLabelText("Tipo de movimiento").closest("dialog")!;
    fireEvent.click(within(addDialog).getByLabelText("Cerrar"));

    expect(onCloseAdd).toHaveBeenCalledOnce();
  });

  it("no longer owns MonthNav — there is no month label or prev/next control here", () => {
    renderTab();

    expect(screen.queryByRole("button", { name: "← Anterior" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Siguiente →" })).toBeNull();
  });

  it("the Add-Transaction form's month select reseeds after a month change", () => {
    const { rerender } = renderTab({ isAddOpen: true });

    rerender(<TransactionsTab {...tabProps({ viewedMonth: "2026-09", isAddOpen: true })} />);

    expect((screen.getByLabelText("Mes") as HTMLSelectElement).value).toBe("2026-09");
  });

  it("with no envelope, offers 'Configurar cuenta separada' and shows no transfer figures", () => {
    const onOpenEnvelopeConfig = vi.fn();
    renderTab({ onOpenEnvelopeConfig });

    fireEvent.click(screen.getByRole("button", { name: "Configurar cuenta separada" }));

    expect(onOpenEnvelopeConfig).toHaveBeenCalledOnce();
    expect(screen.queryByText("Transferencias")).toBeNull();
  });

  it("with an envelope, shows the reminder and the card, and the card's edit button opens the config", () => {
    const onOpenEnvelopeConfig = vi.fn();
    renderTab({ envelope, onOpenEnvelopeConfig });

    expect(screen.getByRole("status").textContent).toContain("Todavía no transferiste");
    expect(screen.getByText("Saldo inicial del mes")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Configurar cuenta separada" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Editar cuenta" }));

    expect(onOpenEnvelopeConfig).toHaveBeenCalledOnce();
  });

  it("renders the envelope config modal open when isEnvelopeConfigOpen is true", () => {
    renderTab({ isEnvelopeConfigOpen: true });

    expect(screen.getByLabelText("Nombre de la cuenta")).toBeTruthy();
  });

  it("with no savings fund, offers 'Configurar ahorros' and shows no fund card", () => {
    const onOpenSavingsFundConfig = vi.fn();
    renderTab({ onOpenSavingsFundConfig });

    fireEvent.click(screen.getByRole("button", { name: "Configurar ahorros" }));

    expect(onOpenSavingsFundConfig).toHaveBeenCalledOnce();
    expect(screen.queryByText("Retirado a la cuenta")).toBeNull();
  });

  it("with a savings fund, shows its card, and the card's edit button opens the config", () => {
    const onOpenSavingsFundConfig = vi.fn();
    renderTab({ savingsFund, onOpenSavingsFundConfig });

    expect(screen.getByText("Retirado a la cuenta")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Configurar ahorros" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Editar ahorros" }));

    expect(onOpenSavingsFundConfig).toHaveBeenCalledOnce();
  });

  it("renders the savings fund config modal open when isSavingsFundConfigOpen is true", () => {
    renderTab({ isSavingsFundConfigOpen: true });

    expect(screen.getByLabelText("Nombre del fondo")).toBeTruthy();
  });

  it("places the savings fund above the envelope, whether configured or not", () => {
    const precedes = (first: HTMLElement, second: HTMLElement) =>
      Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

    const { unmount } = renderTab({ envelope, savingsFund });
    expect(
      precedes(
        screen.getByRole("button", { name: "Editar ahorros" }),
        screen.getByRole("button", { name: "Editar cuenta" })
      )
    ).toBe(true);
    unmount();

    renderTab();
    expect(
      precedes(
        screen.getByRole("button", { name: "Configurar ahorros" }),
        screen.getByRole("button", { name: "Configurar cuenta separada" })
      )
    ).toBe(true);
  });

  it("with a savings fund, the add form offers 'Pagar desde ahorros' and the withdrawal type", () => {
    renderTab({ isAddOpen: true, savingsFund });

    expect(screen.getByLabelText("Pagar desde ahorros")).toBeTruthy();
    const types = (screen.getByLabelText("Tipo de movimiento") as HTMLSelectElement).options;
    expect([...types].map((o) => o.text)).toContain("Retiro de ahorros");
  });

  it("without a savings fund, the add form offers neither", () => {
    renderTab({ isAddOpen: true });

    expect(screen.queryByLabelText("Pagar desde ahorros")).toBeNull();
    const types = (screen.getByLabelText("Tipo de movimiento") as HTMLSelectElement).options;
    expect([...types].map((o) => o.text)).not.toContain("Retiro de ahorros");
  });

  it("with a savings fund, labels fund movements with its name and shows the withdrawals row", () => {
    const dayGroups: DayGroup[] = [
      {
        date: "2026-07-02",
        transactions: [
          { id: "w1", type: "withdrawal", amount: 20_000, date: "2026-07-02", month: "2026-07" },
          {
            id: "e1",
            type: "expense",
            amount: 7_000,
            date: "2026-07-02",
            month: "2026-07",
            bucket: "variable",
            category: { id: "super", name: "Supermercado" },
            paidFrom: "savingsFund",
          },
        ],
      },
    ];
    renderTab({ view: "list", savingsFund, dayGroups });

    expect(screen.getByText("Retiro de Ahorros")).toBeTruthy();
    expect(screen.getByText("desde Ahorros")).toBeTruthy();
  });

  it("with a savings fund, the summary view shows the withdrawals row", () => {
    renderTab({ savingsFund });

    expect(screen.getByText("Retiros de ahorros")).toBeTruthy();
  });

  it("without a savings fund, shows no withdrawals row", () => {
    renderTab();

    expect(screen.queryByText("Retiros de ahorros")).toBeNull();
  });

  describe("split between the summary and the list", () => {
    const dayGroups: DayGroup[] = [
      {
        date: "2026-07-01",
        transactions: [
          { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
        ],
      },
    ];

    it("the summary view shows the summary and the cards but not the list", () => {
      renderTab({ envelope, savingsFund, dayGroups });

      expect(screen.getByText("Balance")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Editar ahorros" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Editar cuenta" })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
      expect(screen.queryByText(/no hay movimientos/i)).toBeNull();
    });

    it("the list view shows the list but not the summary nor the cards", () => {
      renderTab({ view: "list", envelope, savingsFund, dayGroups });

      expect(screen.getByRole("button", { name: /eliminar/i })).toBeTruthy();
      expect(screen.queryByText("Balance")).toBeNull();
      expect(screen.queryByRole("button", { name: "Editar ahorros" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Editar cuenta" })).toBeNull();
      expect(screen.queryByText("Todavía no transferiste", { exact: false })).toBeNull();
    });

    it("only the list view offers 'Nuevo movimiento'", () => {
      const onOpenAdd = vi.fn();
      const { unmount } = renderTab({ view: "summary", onOpenAdd });
      expect(screen.queryByText("Nuevo movimiento")).toBeNull();
      unmount();
      renderTab({ view: "list", onOpenAdd });
      fireEvent.click(screen.getByText("Nuevo movimiento"));

      expect(onOpenAdd).toHaveBeenCalledOnce();
    });

    it("both views show the cross-month confirmation banner", () => {
      const { unmount } = renderTab({ view: "summary", lastCrossMonthSave: "2026-08" });
      expect(screen.getByRole("status").textContent).toMatch(/Guardado en/);
      unmount();
      renderTab({ view: "list", lastCrossMonthSave: "2026-08" });
      expect(screen.getByRole("status").textContent).toMatch(/Guardado en/);
    });

    it("the add form works from either view (the modal is mounted in both)", () => {
      renderTab({ view: "list", isAddOpen: true });

      expect(screen.getByLabelText("Tipo de movimiento")).toBeTruthy();
    });
  });

  it("keeps the envelope and the savings fund independent: both can be configured at once", () => {
    renderTab({ envelope, savingsFund });

    expect(screen.getByRole("button", { name: "Editar cuenta" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Editar ahorros" })).toBeTruthy();
  });
});
