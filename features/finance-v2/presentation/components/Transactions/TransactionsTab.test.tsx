import type { ComponentProps } from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { TransactionsTab } from "./TransactionsTab";
import type { EnvelopeView } from "./Envelope/envelopeView";
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
    balance: 350,
  };
  const categoryOptions: ExpenseCategoryOption[] = [];

  const tabProps = (overrides: Partial<Props> = {}): Props => ({
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

    renderTab({ dayGroups, onDelete });

    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(onDelete).toHaveBeenCalledWith("t1");
  });

  it("shows the empty-state message from the list when there are no transactions", () => {
    renderTab();

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
    renderTab({ onOpenAdd });

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
});
