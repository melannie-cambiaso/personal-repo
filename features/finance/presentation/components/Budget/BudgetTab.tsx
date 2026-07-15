"use client";

import { useRef, useState } from "react";
import { type Group } from "@/features/finance/data/kvAdapter";
import {
  getBudgetForMonth,
  getBudgetUnitConfigForMonth,
  getExcludedCategoriesForMonth,
  setExcludedCategoriesForMonth,
  toggleClosedCategory,
  toggleExcludedCategory,
} from "@/features/finance/data/financeActions";
import { BudgetCategoriesModal } from "./BudgetCategoriesModal";
import {
  computeActualFromTransactions,
  computeBudgetSummary,
  computePendingExpenses,
  deriveUnitTotal,
  DEFAULT_UNIT_CONFIG,
  excludeCategoriesFromGroups,
} from "@/features/finance/domain";
import type { FinanceTransaction, UnitConfig, BudgetUnitConfig } from "@/features/finance/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { prevMonth } from "@/shared/utils/monthUtils";

interface Props {
  groups: Group[];
  initialBudget: Record<string, number>;
  transactions: FinanceTransaction[];
  selectedMonth: string;
  initialClosedCategories?: string[];
  initialExcludedCategories?: string[];
  categoryNotes?: Record<string, string>;
  initialUnitConfig?: BudgetUnitConfig;
  onSave: (budget: Record<string, number>) => Promise<void>;
  onOpenTransaction: (category: string) => void;
  onSaveUnitConfig: (config: BudgetUnitConfig) => Promise<void>;
  onSaveNote?: (category: string, text: string) => void;
}

// ponytail: chains same-key writes through one promise queue so out-of-order network
// resolution can't let an earlier blur's save clobber a later one.
function useOrderedSave<T>(save: (value: T) => Promise<void>) {
  const queueRef = useRef(Promise.resolve());
  return (value: T) => {
    queueRef.current = queueRef.current.then(() => save(value));
  };
}

export function BudgetTab({
  groups,
  initialBudget,
  transactions,
  selectedMonth,
  initialClosedCategories = [],
  initialExcludedCategories = [],
  categoryNotes = {},
  initialUnitConfig = {},
  onSave,
  onOpenTransaction,
  onSaveUnitConfig,
  onSaveNote = () => {},
}: Props) {
  const [budget, setBudget] = useState<Record<string, number>>(initialBudget);
  const [unitConfig, setUnitConfig] = useState<BudgetUnitConfig>(initialUnitConfig);
  const [inputKey, setInputKey] = useState(0);
  const [refMonth, setRefMonth] = useState(prevMonth(selectedMonth));
  const [copying, setCopying] = useState(false);
  const [closedCategories, setClosedCategories] = useState<string[]>(initialClosedCategories);
  const [excludedCategories, setExcludedCategories] =
    useState<string[]>(initialExcludedCategories);
  const [expandedNoteCategory, setExpandedNoteCategory] = useState<string | null>(null);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [lastUnitConfig, setLastUnitConfig] = useState<Record<string, UnitConfig>>({});
  const saveBudgetOrdered = useOrderedSave(onSave);
  const saveUnitConfigOrdered = useOrderedSave(onSaveUnitConfig);

  const actual = computeActualFromTransactions(transactions);

  const handleBlur = (category: string, raw: string) => {
    const next = { ...budget, [category]: Math.max(0, Number(raw) || 0) };
    setBudget(next);
    saveBudgetOrdered(next);
  };

  // Applies a new unit config: persists it, re-derives every category's total from it onto
  // `baseBudget` (defaults to current budget), and persists that. Shared by every code path
  // that changes unit config so they can't drift into inconsistent save/derive behavior.
  const applyUnitConfig = (
    nextConfig: BudgetUnitConfig,
    baseBudget: Record<string, number> = budget
  ) => {
    setUnitConfig(nextConfig);
    saveUnitConfigOrdered(nextConfig);

    const nextBudget = { ...baseBudget };
    for (const [cat, cfg] of Object.entries(nextConfig)) nextBudget[cat] = deriveUnitTotal(cfg);
    setBudget(nextBudget);
    saveBudgetOrdered(nextBudget);
  };

  const handleUnitBlur = (category: string, field: keyof UnitConfig, raw: string) => {
    if (closedCategories.includes(category)) return;

    const cur = unitConfig[category] ?? { unitAmount: 0, ...DEFAULT_UNIT_CONFIG };
    const nextCfg = { ...cur, [field]: Math.max(0, Number(raw) || 0) };
    applyUnitConfig({ ...unitConfig, [category]: nextCfg });
  };

  const handleToggleUnitMode = (category: string) => {
    if (closedCategories.includes(category)) return;

    if (unitConfig[category]) {
      setLastUnitConfig((prev) => ({ ...prev, [category]: unitConfig[category] }));
      const rest = Object.fromEntries(
        Object.entries(unitConfig).filter(([cat]) => cat !== category)
      );
      applyUnitConfig(rest);
      setInputKey((k) => k + 1);
      return;
    }

    const seeded: UnitConfig = lastUnitConfig[category] ?? {
      unitAmount: budget[category] ?? 0,
      ...DEFAULT_UNIT_CONFIG,
    };
    applyUnitConfig({ ...unitConfig, [category]: seeded });
    setInputKey((k) => k + 1);
  };

  const handleToggleClose = (category: string) => {
    const next = closedCategories.includes(category)
      ? closedCategories.filter((c) => c !== category)
      : [...closedCategories, category];
    setClosedCategories(next);
    void toggleClosedCategory(selectedMonth, category);
  };

  const handleToggleExcluded = (category: string) => {
    const next = excludedCategories.includes(category)
      ? excludedCategories.filter((c) => c !== category)
      : [...excludedCategories, category];
    setExcludedCategories(next);
    void toggleExcludedCategory(selectedMonth, category);
  };

  const handleToggleNoteExpand = (category: string) => {
    setExpandedNoteCategory((prev) => (prev === category ? null : category));
  };

  const handleCopy = async () => {
    setCopying(true);
    const [refBudget, refConfig, refExcluded] = await Promise.all([
      getBudgetForMonth(refMonth),
      getBudgetUnitConfigForMonth(refMonth),
      getExcludedCategoriesForMonth(refMonth),
    ]);

    applyUnitConfig(refConfig, refBudget);
    setExcludedCategories(refExcluded);
    void setExcludedCategoriesForMonth(selectedMonth, refExcluded);
    setInputKey((k) => k + 1);
    setCopying(false);
  };

  const incomeGroups = groups.filter((g) => g.type === "income");
  const refundGroups = groups.filter((g) => g.type === "refund");
  const expenseGroups = excludeCategoriesFromGroups(
    groups.filter((g) => g.type === "expense"),
    excludedCategories
  );

  const sumBudget = (gs: Group[]) =>
    gs.flatMap((g) => g.categories).reduce((s, c) => s + (budget[c] ?? 0), 0);
  const sumActual = (gs: Group[]) =>
    gs.flatMap((g) => g.categories).reduce((s, c) => s + (actual[c] ?? 0), 0);

  const budgetIncome = sumBudget(incomeGroups);
  const budgetRefund = sumBudget(refundGroups);
  const budgetExpense = sumBudget(expenseGroups);
  const actualIncome = sumActual(incomeGroups);
  const actualRefund = sumActual(refundGroups);
  const actualExpense = sumActual(expenseGroups);

  const allExpenseCategories = expenseGroups.flatMap((g) => g.categories);
  const pendingExpenses = computePendingExpenses(
    budget,
    actual,
    allExpenseCategories,
    closedCategories,
    excludedCategories
  );
  const pendingAmount =
    actualExpense > budgetExpense ? -(actualExpense - budgetExpense) : pendingExpenses;

  const { realBalance, available, potentialSavings } = computeBudgetSummary({
    actualIncome,
    actualExpense,
    actualRefund,
    budgetRefund,
    pendingExpenses,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="border-cream-300 flex flex-wrap items-center gap-3 rounded-xl border bg-white px-4 py-3">
        <span className="text-brown-500 text-xs whitespace-nowrap">Copiar desde</span>
        <input
          type="month"
          value={refMonth}
          max={prevMonth(selectedMonth)}
          onChange={(e) => setRefMonth(e.target.value)}
          className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
        />
        <button
          onClick={handleCopy}
          disabled={copying || !refMonth}
          className="bg-brown-800 hover:bg-brown-700 cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
        >
          {copying ? "Copiando..." : "Copiar"}
        </button>
        <a
          href={`/api/finance/budget/export?month=${selectedMonth}`}
          className="border-brown-800 text-brown-800 hover:bg-brown-800 cursor-pointer rounded-lg border px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:text-white"
        >
          Exportar a Excel
        </a>
        <button
          type="button"
          onClick={() => setIsCategoriesModalOpen(true)}
          className="border-brown-800 text-brown-800 hover:bg-brown-800 cursor-pointer rounded-lg border px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:text-white"
        >
          Categorías
        </button>
      </div>

      <BudgetCategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        month={selectedMonth}
        groups={groups}
        excludedCategories={excludedCategories}
        onToggle={handleToggleExcluded}
      />

      <div className="border-brown-300 overflow-hidden rounded-xl border bg-white">
        <div className="border-cream-200 border-b px-4 py-3">
          <span className="text-brown-800 text-sm font-semibold">Balance</span>
        </div>
        <div className="grid grid-cols-4 gap-3 p-4">
          <SummaryCard label="Ingresos" budget={budgetIncome} actual={actualIncome} />
          <SummaryCard
            label="Gastos"
            budget={budgetExpense}
            actual={actualExpense}
            pendingAmount={pendingAmount}
          />
          <SummaryCard
            label="Neto"
            budget={budgetIncome - budgetExpense}
            actual={realBalance}
            disponible={available}
            ahorroPotencial={potentialSavings}
          />
          <SummaryCard label="Devoluciones" budget={budgetRefund} actual={actualRefund} />
        </div>
      </div>

      <BudgetTableView
        incomeGroups={incomeGroups}
        expenseGroups={expenseGroups}
        refundGroups={refundGroups}
        budget={budget}
        actual={actual}
        unitConfig={unitConfig}
        inputKey={inputKey}
        onBlur={handleBlur}
        onUnitBlur={handleUnitBlur}
        onToggleUnitMode={handleToggleUnitMode}
        onOpenTransaction={onOpenTransaction}
        closedCategories={closedCategories}
        onToggleClose={handleToggleClose}
        categoryNotes={categoryNotes}
        expandedNoteCategory={expandedNoteCategory}
        onToggleNoteExpand={handleToggleNoteExpand}
        onSaveNote={onSaveNote}
      />
      <BudgetCardsView
        incomeGroups={incomeGroups}
        expenseGroups={expenseGroups}
        refundGroups={refundGroups}
        budget={budget}
        actual={actual}
        unitConfig={unitConfig}
        inputKey={inputKey}
        onBlur={handleBlur}
        onUnitBlur={handleUnitBlur}
        onToggleUnitMode={handleToggleUnitMode}
        onOpenTransaction={onOpenTransaction}
        closedCategories={closedCategories}
        onToggleClose={handleToggleClose}
        categoryNotes={categoryNotes}
        expandedNoteCategory={expandedNoteCategory}
        onToggleNoteExpand={handleToggleNoteExpand}
        onSaveNote={onSaveNote}
      />
    </div>
  );
}

interface ResponsiveViewProps {
  incomeGroups: Group[];
  expenseGroups: Group[];
  refundGroups: Group[];
  budget: Record<string, number>;
  actual: Record<string, number>;
  unitConfig: BudgetUnitConfig;
  inputKey: number;
  onBlur: (category: string, value: string) => void;
  onUnitBlur: (category: string, field: keyof UnitConfig, value: string) => void;
  onToggleUnitMode: (category: string) => void;
  onOpenTransaction: (category: string) => void;
  closedCategories: string[];
  onToggleClose: (category: string) => void;
  categoryNotes: Record<string, string>;
  expandedNoteCategory: string | null;
  onToggleNoteExpand: (category: string) => void;
  onSaveNote: (category: string, text: string) => void;
}

/** Desktop dense table layout. Markup is unchanged from the pre-split BudgetTab — only wrapped and hidden below `sm`. */
function BudgetTableView({
  incomeGroups,
  expenseGroups,
  refundGroups,
  budget,
  actual,
  unitConfig,
  inputKey,
  onBlur,
  onUnitBlur,
  onToggleUnitMode,
  onOpenTransaction,
  closedCategories,
  onToggleClose,
  categoryNotes,
  expandedNoteCategory,
  onToggleNoteExpand,
  onSaveNote,
}: ResponsiveViewProps) {
  return (
    <div data-testid="budget-table" className="hidden flex-col gap-6 sm:flex">
      <GroupSection
        title="Ingresos"
        groups={incomeGroups}
        budget={budget}
        actual={actual}
        unitConfig={unitConfig}
        isIncome
        inputKey={inputKey}
        onBlur={onBlur}
        onUnitBlur={onUnitBlur}
        onToggleUnitMode={onToggleUnitMode}
        onOpenTransaction={onOpenTransaction}
      />
      <GroupSection
        title="Gastos"
        groups={expenseGroups}
        budget={budget}
        actual={actual}
        unitConfig={unitConfig}
        isIncome={false}
        inputKey={inputKey}
        onBlur={onBlur}
        onUnitBlur={onUnitBlur}
        onToggleUnitMode={onToggleUnitMode}
        onOpenTransaction={onOpenTransaction}
        closedCategories={closedCategories}
        onToggleClose={onToggleClose}
        categoryNotes={categoryNotes}
        expandedNoteCategory={expandedNoteCategory}
        onToggleNoteExpand={onToggleNoteExpand}
        onSaveNote={onSaveNote}
      />
      <GroupSection
        title="Devoluciones"
        groups={refundGroups}
        budget={budget}
        actual={actual}
        unitConfig={unitConfig}
        isIncome={true}
        inputKey={inputKey}
        onBlur={onBlur}
        onUnitBlur={onUnitBlur}
        onToggleUnitMode={onToggleUnitMode}
        onOpenTransaction={onOpenTransaction}
      />
    </div>
  );
}

/** Mobile stacked-card layout for the same category data. Visible below `sm`, hidden at `sm` and up. */
function BudgetCardsView({
  incomeGroups,
  expenseGroups,
  refundGroups,
  budget,
  actual,
  unitConfig,
  inputKey,
  onBlur,
  onUnitBlur,
  onToggleUnitMode,
  onOpenTransaction,
  closedCategories,
  onToggleClose,
  categoryNotes,
  expandedNoteCategory,
  onToggleNoteExpand,
  onSaveNote,
}: ResponsiveViewProps) {
  return (
    <div data-testid="budget-cards" className="flex flex-col gap-6 sm:hidden">
      <CardsSection
        title="Ingresos"
        groups={incomeGroups}
        budget={budget}
        actual={actual}
        unitConfig={unitConfig}
        isIncome
        inputKey={inputKey}
        onBlur={onBlur}
        onUnitBlur={onUnitBlur}
        onToggleUnitMode={onToggleUnitMode}
        onOpenTransaction={onOpenTransaction}
      />
      <CardsSection
        title="Gastos"
        groups={expenseGroups}
        budget={budget}
        actual={actual}
        unitConfig={unitConfig}
        isIncome={false}
        inputKey={inputKey}
        onBlur={onBlur}
        onUnitBlur={onUnitBlur}
        onToggleUnitMode={onToggleUnitMode}
        onOpenTransaction={onOpenTransaction}
        closedCategories={closedCategories}
        onToggleClose={onToggleClose}
        categoryNotes={categoryNotes}
        expandedNoteCategory={expandedNoteCategory}
        onToggleNoteExpand={onToggleNoteExpand}
        onSaveNote={onSaveNote}
      />
      <CardsSection
        title="Devoluciones"
        groups={refundGroups}
        budget={budget}
        actual={actual}
        unitConfig={unitConfig}
        isIncome={true}
        inputKey={inputKey}
        onBlur={onBlur}
        onUnitBlur={onUnitBlur}
        onToggleUnitMode={onToggleUnitMode}
        onOpenTransaction={onOpenTransaction}
      />
    </div>
  );
}

interface CategoryNoteProps {
  value?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSave: (text: string) => void;
}

/**
 * Shared category-name cell for both `GroupSection` (desktop table) and
 * `CardsSection` (mobile cards). Renders a plain name span when `notes` is
 * absent (income/refund rows, unchanged from before this feature). When
 * `notes` is present (expense rows only), the name becomes a toggle button
 * with a dot indicator shown only when a non-empty note exists, expanding to
 * an inline textarea — kept inside this single cell so it never overflows
 * into neighboring grid columns, and adds zero buttons to the action cluster.
 */
function CategoryNameCell({
  category,
  isClosed,
  bold = false,
  notes,
}: {
  category: string;
  isClosed: boolean;
  bold?: boolean;
  notes?: CategoryNoteProps;
}) {
  const textClass = `text-brown-700 text-sm ${bold ? "font-semibold" : ""} ${isClosed ? "line-through" : ""}`;

  if (!notes) {
    return <span className={textClass}>{category}</span>;
  }

  const hasNote = !!notes.value?.trim();

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <button
        type="button"
        onClick={notes.onToggleExpand}
        className={`flex min-w-0 items-center gap-1.5 text-left ${textClass}`}
        aria-label={hasNote ? `Ver nota de ${category}` : `Agregar nota a ${category}`}
      >
        <span className="truncate">{category}</span>
        {hasNote && (
          <span
            aria-hidden="true"
            data-testid={`note-indicator-${category}`}
            className="bg-brown-600 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          />
        )}
      </button>
      {notes.isExpanded && (
        <textarea
          defaultValue={notes.value ?? ""}
          onBlur={(e) => notes.onSave(e.target.value)}
          placeholder="Agregar nota..."
          rows={2}
          className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 w-full min-w-0 rounded-lg border px-2 py-1 text-xs outline-none"
        />
      )}
    </div>
  );
}

export function SummaryCard({
  label,
  budget,
  actual,
  pendingAmount,
  disponible,
  ahorroPotencial,
}: {
  label: string;
  budget: number;
  actual: number;
  pendingAmount?: number;
  disponible?: number;
  ahorroPotencial?: number;
}) {
  return (
    <div className="border-cream-200 flex min-h-[6rem] flex-col gap-1 rounded-lg border p-3 text-center">
      <span className="text-2xs text-brown-400 font-semibold tracking-wide uppercase">{label}</span>
      <span className="text-brown-500 text-xs">Presup. {formatCLP(budget)}</span>
      <span className="text-brown-900 text-sm font-bold">Real {formatCLP(actual)}</span>
      {pendingAmount !== undefined && (
        <span
          className={`text-xs font-semibold ${pendingAmount < 0 ? "text-red-500" : "text-brown-400"}`}
        >
          {pendingAmount < 0
            ? `Excedido ${formatCLP(Math.abs(pendingAmount))}`
            : `Pendiente ${formatCLP(pendingAmount)}`}
        </span>
      )}
      {disponible !== undefined && (
        <span
          className={`text-xs font-semibold ${disponible < 0 ? "text-red-500" : "text-green-600"}`}
        >
          {disponible < 0
            ? `Faltante ${formatCLP(Math.abs(disponible))}`
            : `Disponible ${formatCLP(disponible)}`}
        </span>
      )}
      {ahorroPotencial !== undefined && (
        <span
          className={`text-xs font-semibold ${ahorroPotencial < 0 ? "text-red-500" : "text-green-600"}`}
        >
          Ahorro potencial {formatCLP(Math.abs(ahorroPotencial))}
        </span>
      )}
    </div>
  );
}

function GroupSection({
  title,
  groups,
  budget,
  actual,
  unitConfig,
  isIncome,
  inputKey,
  onBlur,
  onUnitBlur,
  onToggleUnitMode,
  onOpenTransaction,
  closedCategories = [],
  onToggleClose,
  categoryNotes = {},
  expandedNoteCategory = null,
  onToggleNoteExpand,
  onSaveNote,
}: {
  title: string;
  groups: Group[];
  budget: Record<string, number>;
  actual: Record<string, number>;
  unitConfig: BudgetUnitConfig;
  isIncome: boolean;
  inputKey: number;
  onBlur: (category: string, value: string) => void;
  onUnitBlur: (category: string, field: keyof UnitConfig, value: string) => void;
  onToggleUnitMode: (category: string) => void;
  onOpenTransaction: (category: string) => void;
  closedCategories?: string[];
  onToggleClose?: (category: string) => void;
  categoryNotes?: Record<string, string>;
  expandedNoteCategory?: string | null;
  onToggleNoteExpand?: (category: string) => void;
  onSaveNote?: (category: string, text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-brown-400 text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {groups.map((g) => {
        const totalBudget = g.categories.reduce((s, c) => s + (budget[c] ?? 0), 0);
        const totalActual = g.categories.reduce((s, c) => s + (actual[c] ?? 0), 0);
        const totalDiff = isIncome ? totalActual - totalBudget : totalBudget - totalActual;

        return (
          <div key={g.name} className="border-cream-300 overflow-hidden rounded-xl border bg-white">
            <div className="border-cream-200 border-b px-4 py-3">
              <span className="text-brown-800 text-sm font-semibold">{g.name}</span>
            </div>

            <div className="text-2xs text-brown-400 grid grid-cols-4 gap-2 px-4 py-2 font-semibold tracking-wide uppercase">
              <span>Categoría</span>
              <span className="text-right">Presupuesto</span>
              <span className="text-right">Real</span>
              <span className="text-right">Diferencia</span>
            </div>

            {[...g.categories]
              .sort((a, b) => a.localeCompare(b, "es"))
              .map((cat) => {
                const planned = budget[cat] ?? 0;
                const real = actual[cat] ?? 0;
                const diff = isIncome ? real - planned : planned - real;
                const isClosed = !isIncome && closedCategories.includes(cat);
                const cfg = unitConfig[cat];
                return (
                  <div
                    key={cat}
                    aria-disabled={isIncome ? undefined : isClosed}
                    className={`border-cream-100 grid grid-cols-4 items-center gap-2 border-t px-4 py-2 ${isClosed ? "opacity-50" : ""}`}
                  >
                    <CategoryNameCell
                      category={cat}
                      isClosed={isClosed}
                      notes={
                        !isIncome && onToggleNoteExpand && onSaveNote
                          ? {
                              value: categoryNotes[cat],
                              isExpanded: expandedNoteCategory === cat,
                              onToggleExpand: () => onToggleNoteExpand(cat),
                              onSave: (text) => onSaveNote(cat, text),
                            }
                          : undefined
                      }
                    />
                    <div className="flex min-w-0 justify-end">
                      {cfg ? (
                        <div className="flex w-full min-w-0 max-w-24 flex-col items-end gap-1">
                          <input
                            type="number"
                            min="0"
                            key={`${inputKey}-ua-${cat}`}
                            defaultValue={cfg.unitAmount}
                            placeholder="0"
                            autoComplete="off"
                            disabled={isClosed}
                            aria-label="Monto unitario"
                            onBlur={(e) => onUnitBlur(cat, "unitAmount", e.target.value)}
                            className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 w-full min-w-0 rounded-lg border px-2 py-1 text-right text-sm outline-none"
                          />
                          <input
                            type="number"
                            min="0"
                            key={`${inputKey}-qty-${cat}`}
                            defaultValue={cfg.quantity}
                            placeholder="0"
                            autoComplete="off"
                            disabled={isClosed}
                            aria-label="Cantidad"
                            onBlur={(e) => onUnitBlur(cat, "quantity", e.target.value)}
                            className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 w-full min-w-0 rounded-lg border px-2 py-1 text-right text-sm outline-none"
                          />
                          <input
                            type="number"
                            step="any"
                            key={`${inputKey}-factor-${cat}`}
                            defaultValue={cfg.factor}
                            placeholder="0"
                            autoComplete="off"
                            disabled={isClosed}
                            aria-label="Factor"
                            onBlur={(e) => onUnitBlur(cat, "factor", e.target.value)}
                            className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 w-full min-w-0 rounded-lg border px-2 py-1 text-right text-sm outline-none"
                          />
                          <span className="text-brown-900 w-full truncate text-right text-xs font-semibold">
                            {formatCLP(deriveUnitTotal(cfg))}
                          </span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          key={`${inputKey}-b-${cat}`}
                          defaultValue={planned || ""}
                          placeholder="0"
                          autoComplete="off"
                          disabled={isClosed}
                          onBlur={(e) => onBlur(cat, e.target.value)}
                          className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 w-24 rounded-lg border px-2 py-1 text-right text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
                      <span className="text-brown-900 text-sm">
                        {real > 0 ? formatCLP(real) : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenTransaction(cat)}
                        className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 cursor-pointer rounded-md border px-1.5 py-0.5 text-xs transition-colors"
                        aria-label={`Agregar transacción para ${cat}`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleUnitMode(cat)}
                        disabled={isClosed}
                        aria-pressed={!!cfg}
                        className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 cursor-pointer rounded-md border px-1.5 py-0.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cfg ? "Fijo" : "Unitario"}
                      </button>
                      {!isIncome && onToggleClose && (
                        <button
                          type="button"
                          onClick={() => onToggleClose(cat)}
                          aria-pressed={isClosed}
                          className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 cursor-pointer rounded-md border px-1.5 py-0.5 text-xs transition-colors"
                          aria-label={isClosed ? `Reabrir ${cat}` : `Cerrar ${cat}`}
                        >
                          {isClosed ? "Abrir" : "Cerrar"}
                        </button>
                      )}
                    </div>
                    <span
                      className={`text-right text-sm font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-brown-400"}`}
                    >
                      {diff !== 0 ? `${diff > 0 ? "+" : ""}${formatCLP(diff)}` : "—"}
                    </span>
                  </div>
                );
              })}

            <div className="border-cream-300 bg-cream-50 grid grid-cols-4 items-center gap-2 border-t px-4 py-3">
              <span className="text-2xs text-brown-500 font-semibold tracking-wide uppercase">
                Total {g.name}
              </span>
              <span className="text-brown-900 text-right text-sm font-bold">
                {formatCLP(totalBudget)}
              </span>
              <span className="text-brown-900 text-right text-sm font-bold">
                {formatCLP(totalActual)}
              </span>
              <span
                className={`text-right text-sm font-bold ${totalDiff > 0 ? "text-green-600" : totalDiff < 0 ? "text-red-500" : "text-brown-400"}`}
              >
                {totalDiff !== 0 ? `${totalDiff > 0 ? "+" : ""}${formatCLP(totalDiff)}` : "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Mobile equivalent of `GroupSection`: same category data, rendered as stacked
 * cards (label/value pairs) instead of a `grid-cols-4` row, so currency values
 * never clip or wrap on narrow viewports. Action buttons meet the 44x44px
 * minimum tap target per the Responsive Convention.
 */
function CardsSection({
  title,
  groups,
  budget,
  actual,
  unitConfig,
  isIncome,
  inputKey,
  onBlur,
  onUnitBlur,
  onToggleUnitMode,
  onOpenTransaction,
  closedCategories = [],
  onToggleClose,
  categoryNotes = {},
  expandedNoteCategory = null,
  onToggleNoteExpand,
  onSaveNote,
}: {
  title: string;
  groups: Group[];
  budget: Record<string, number>;
  actual: Record<string, number>;
  unitConfig: BudgetUnitConfig;
  isIncome: boolean;
  inputKey: number;
  onBlur: (category: string, value: string) => void;
  onUnitBlur: (category: string, field: keyof UnitConfig, value: string) => void;
  onToggleUnitMode: (category: string) => void;
  onOpenTransaction: (category: string) => void;
  closedCategories?: string[];
  onToggleClose?: (category: string) => void;
  categoryNotes?: Record<string, string>;
  expandedNoteCategory?: string | null;
  onToggleNoteExpand?: (category: string) => void;
  onSaveNote?: (category: string, text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-brown-400 text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {groups.map((g) => {
        const totalBudget = g.categories.reduce((s, c) => s + (budget[c] ?? 0), 0);
        const totalActual = g.categories.reduce((s, c) => s + (actual[c] ?? 0), 0);
        const totalDiff = isIncome ? totalActual - totalBudget : totalBudget - totalActual;

        return (
          <div key={g.name} className="border-cream-300 overflow-hidden rounded-xl border bg-white">
            <div className="border-cream-200 border-b px-4 py-3">
              <span className="text-brown-800 text-sm font-semibold">{g.name}</span>
            </div>

            <div className="flex flex-col gap-3 p-4">
              {[...g.categories]
                .sort((a, b) => a.localeCompare(b, "es"))
                .map((cat) => {
                  const planned = budget[cat] ?? 0;
                  const real = actual[cat] ?? 0;
                  const diff = isIncome ? real - planned : planned - real;
                  const isClosed = !isIncome && closedCategories.includes(cat);
                  const cfg = unitConfig[cat];
                  return (
                    <div
                      key={cat}
                      aria-disabled={isIncome ? undefined : isClosed}
                      className={`border-cream-100 flex flex-col gap-2 rounded-lg border p-3 ${isClosed ? "opacity-50" : ""}`}
                    >
                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                        <CategoryNameCell
                          category={cat}
                          isClosed={isClosed}
                          bold
                          notes={
                            !isIncome && onToggleNoteExpand && onSaveNote
                              ? {
                                  value: categoryNotes[cat],
                                  isExpanded: expandedNoteCategory === cat,
                                  onToggleExpand: () => onToggleNoteExpand(cat),
                                  onSave: (text) => onSaveNote(cat, text),
                                }
                              : undefined
                          }
                        />
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenTransaction(cat)}
                            className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 min-h-11 min-w-11 inline-flex cursor-pointer items-center justify-center rounded-md border text-xs transition-colors"
                            aria-label={`Agregar transacción para ${cat}`}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleUnitMode(cat)}
                            disabled={isClosed}
                            aria-pressed={!!cfg}
                            className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 min-h-11 min-w-11 inline-flex cursor-pointer items-center justify-center rounded-md border text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {cfg ? "Fijo" : "Unitario"}
                          </button>
                          {!isIncome && onToggleClose && (
                            <button
                              type="button"
                              onClick={() => onToggleClose(cat)}
                              aria-pressed={isClosed}
                              className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 min-h-11 min-w-11 inline-flex cursor-pointer items-center justify-center rounded-md border text-xs transition-colors"
                              aria-label={isClosed ? `Reabrir ${cat}` : `Cerrar ${cat}`}
                            >
                              {isClosed ? "Abrir" : "Cerrar"}
                            </button>
                          )}
                        </div>
                      </div>

                      {cfg ? (
                        <div className="flex flex-col gap-2 text-xs">
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <span className="text-brown-500 truncate">Monto unitario</span>
                            <input
                              type="number"
                              min="0"
                              key={`${inputKey}-ua-${cat}`}
                              defaultValue={cfg.unitAmount}
                              placeholder="0"
                              autoComplete="off"
                              disabled={isClosed}
                              aria-label="Monto unitario"
                              onBlur={(e) => onUnitBlur(cat, "unitAmount", e.target.value)}
                              className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 w-24 shrink-0 rounded-lg border px-2 py-1 text-right text-sm outline-none"
                            />
                          </div>
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <span className="text-brown-500 truncate">Cantidad</span>
                            <input
                              type="number"
                              min="0"
                              key={`${inputKey}-qty-${cat}`}
                              defaultValue={cfg.quantity}
                              placeholder="0"
                              autoComplete="off"
                              disabled={isClosed}
                              aria-label="Cantidad"
                              onBlur={(e) => onUnitBlur(cat, "quantity", e.target.value)}
                              className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 w-24 shrink-0 rounded-lg border px-2 py-1 text-right text-sm outline-none"
                            />
                          </div>
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <span className="text-brown-500 truncate">Factor</span>
                            <input
                              type="number"
                              step="any"
                              key={`${inputKey}-factor-${cat}`}
                              defaultValue={cfg.factor}
                              placeholder="0"
                              autoComplete="off"
                              disabled={isClosed}
                              aria-label="Factor"
                              onBlur={(e) => onUnitBlur(cat, "factor", e.target.value)}
                              className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 w-24 shrink-0 rounded-lg border px-2 py-1 text-right text-sm outline-none"
                            />
                          </div>
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <span className="text-brown-500 truncate">Total</span>
                            <span className="text-brown-900 shrink-0 truncate font-semibold">
                              {formatCLP(deriveUnitTotal(cfg))}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-brown-500">Presupuesto</span>
                          <input
                            type="number"
                            min="0"
                            key={`${inputKey}-b-${cat}`}
                            defaultValue={planned || ""}
                            placeholder="0"
                            autoComplete="off"
                            disabled={isClosed}
                            onBlur={(e) => onBlur(cat, e.target.value)}
                            className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 w-24 rounded-lg border px-2 py-1 text-right text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-brown-500">Real</span>
                        <span className="text-brown-900 font-semibold">
                          {real > 0 ? formatCLP(real) : "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-brown-500">Diferencia</span>
                        <span
                          className={`font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-brown-400"}`}
                        >
                          {diff !== 0 ? `${diff > 0 ? "+" : ""}${formatCLP(diff)}` : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="border-cream-300 bg-cream-50 flex items-center justify-between gap-2 border-t px-4 py-3">
              <span className="text-2xs text-brown-500 font-semibold tracking-wide uppercase">
                Total {g.name}
              </span>
              <div className="flex items-center gap-3 text-right text-sm font-bold">
                <span className="text-brown-900">{formatCLP(totalBudget)}</span>
                <span className="text-brown-900">{formatCLP(totalActual)}</span>
                <span
                  className={totalDiff > 0 ? "text-green-600" : totalDiff < 0 ? "text-red-500" : "text-brown-400"}
                >
                  {totalDiff !== 0 ? `${totalDiff > 0 ? "+" : ""}${formatCLP(totalDiff)}` : "—"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
