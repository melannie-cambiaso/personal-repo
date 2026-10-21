"use client";

import { useState } from "react";
import type {
  ExpenseBucketKey,
  ExpenseCategoryOption,
  FinanceV2Transaction,
  TransactionCategoryRef,
} from "@/features/finance-v2/domain";
import { toLocalISODate } from "@/features/finance-v2/domain";
import { monthWindow } from "@/shared/utils/monthUtils";
import { formatMonth } from "@/shared/utils/formatMonth";
import type { NewTransactionInput } from "../../hooks/useFinanceV2Transactions";
import { Button, Input, Select } from "@/shared/components";
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_ORDER } from "./transactionLabels";
import { BUCKET_LABELS } from "../bucketLabels";

type TransactionType = FinanceV2Transaction["type"];

const NO_CATEGORY = "";

/** How many months on each side of `viewedMonth` the month picker offers — a
 *  finance-v2 product rule, so it lives at the call site (this used to be where
 *  `monthBounds` lived), not inside the generic `monthWindow` helper. */
const MONTH_RADIUS = 3;

interface Props {
  viewedMonth: string;
  categoryOptions: ExpenseCategoryOption[];
  /** The viewed month's budget income sources, offered for an income (optional pick). */
  incomeSourceOptions?: TransactionCategoryRef[];
  hasEnvelope: boolean;
  /** A savings fund is configured: offers the withdrawal type and, on an expense, the
   *  "Pagar desde ahorros" choice. Optional so callers without a fund stay unchanged. */
  hasSavingsFund?: boolean;
  /** Edit mode: seeds every field from this transaction and locks the month
   *  (editing never moves a transaction to another month). */
  initialTransaction?: FinanceV2Transaction;
  onAdd: (input: NewTransactionInput) => void;
}

// Choosing a subcategory HIDES the bucket select entirely: bucket is unaskable twice
// because the control simply isn't rendered, not because it's disabled.
export function TransactionForm({
  viewedMonth,
  categoryOptions: liveCategoryOptions,
  incomeSourceOptions: liveIncomeSourceOptions = [],
  hasEnvelope,
  hasSavingsFund = false,
  initialTransaction,
  onAdd,
}: Props) {
  const isEditing = initialTransaction !== undefined;
  // A snapshotted category that no longer exists in the budget stays selectable
  // while editing, so saving an unrelated field doesn't silently drop it.
  const categoryOptions = [...withSnapshotOption(liveCategoryOptions, initialTransaction)].sort(
    (a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );
  // Same passive orphan rule for an income's source: kept in budget order, the snapshot
  // of a source deleted from the budget is appended so editing never drops it.
  const incomeSourceOptions = withIncomeSnapshotOption(liveIncomeSourceOptions, initialTransaction);
  const monthOptions = monthWindow(viewedMonth, MONTH_RADIUS);
  // The form only offers a transfer once an envelope exists (spec) — or when
  // editing an existing transfer.
  const typeOptions: TransactionType[] = [
    ...TRANSACTION_TYPE_ORDER,
    ...(hasEnvelope || initialTransaction?.type === "transfer" ? (["transfer"] as const) : []),
    // Same rule for the fund's withdrawal: offered once a fund exists, or while editing one.
    ...(hasSavingsFund || initialTransaction?.type === "withdrawal"
      ? (["withdrawal"] as const)
      : []),
  ];
  // The checkbox follows the passive-orphan rule too: an already fund-paid expense keeps it
  // (checked) even if the fund config is gone, so saving an unrelated field never drops it.
  const showPayFromSavings =
    hasSavingsFund ||
    (initialTransaction?.type === "expense" && initialTransaction.paidFrom === "savingsFund");

  const [type, setType] = useState<TransactionType>(initialTransaction?.type ?? "expense");
  const [amount, setAmount] = useState(initialTransaction ? String(initialTransaction.amount) : "");
  const [date, setDate] = useState(() => initialTransaction?.date ?? toLocalISODate(new Date()));
  const [month, setMonth] = useState(initialTransaction?.month ?? viewedMonth);
  const [note, setNote] = useState(initialTransaction?.note ?? "");
  const [bucket, setBucket] = useState<ExpenseBucketKey>(
    initialTransaction?.type === "expense" ? initialTransaction.bucket : "fixed"
  );
  const [categoryId, setCategoryId] = useState(
    initialTransaction?.type === "expense"
      ? (initialTransaction.category?.id ?? NO_CATEGORY)
      : NO_CATEGORY
  );
  // An explicit per-expense choice (any category can use the fund); seeded from the stored
  // funding when editing and cleared on submit like the other expense-only fields.
  const [payFromSavings, setPayFromSavings] = useState(
    initialTransaction?.type === "expense" && initialTransaction.paidFrom === "savingsFund"
  );
  // Separate from `categoryId` on purpose (design D3): `type` switching does NOT
  // reset either id, only submit does — sharing one id would let an expense pick
  // silently reappear as a savings source (or vice versa) after switching type.
  const [sourceCategoryId, setSourceCategoryId] = useState(
    initialTransaction?.type === "savings"
      ? (initialTransaction.sourceCategory?.id ?? NO_CATEGORY)
      : NO_CATEGORY
  );

  // Its own id, like `sourceCategoryId`: switching type never carries it into another type.
  const [incomeSourceId, setIncomeSourceId] = useState(
    initialTransaction?.type === "income"
      ? (initialTransaction.source?.id ?? NO_CATEGORY)
      : NO_CATEGORY
  );

  const selectedCategory = categoryOptions.find((c) => c.id === categoryId) ?? null;
  const selectedIncomeSource = incomeSourceOptions.find((s) => s.id === incomeSourceId) ?? null;
  const selectedSourceCategory = categoryOptions.find((c) => c.id === sourceCategoryId) ?? null;

  // `date` and `month` are NOT reset — sticky like `type` (design decision #6): filing
  // several transactions into the same other month shouldn't require re-picking each time.
  const reset = () => {
    setAmount("");
    setNote("");
    setCategoryId(NO_CATEGORY);
    setBucket("fixed");
    setSourceCategoryId(NO_CATEGORY);
    setIncomeSourceId(NO_CATEGORY);
    setPayFromSavings(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    if (type === "expense") {
      const resolvedBucket = selectedCategory ? selectedCategory.bucket : bucket;
      onAdd({
        type: "expense",
        amount: parsedAmount,
        date,
        month,
        note: note.trim() || undefined,
        bucket: resolvedBucket,
        category: selectedCategory
          ? { id: selectedCategory.id, name: selectedCategory.name }
          : null,
        ...(payFromSavings ? { paidFrom: "savingsFund" as const } : {}),
      });
    } else if (type === "savings") {
      onAdd({
        type: "savings",
        amount: parsedAmount,
        date,
        month,
        note: note.trim() || undefined,
        ...(selectedSourceCategory
          ? {
              sourceCategory: {
                id: selectedSourceCategory.id,
                name: selectedSourceCategory.name,
                bucket: selectedSourceCategory.bucket,
              },
            }
          : {}),
      });
    } else if (type === "income") {
      onAdd({
        type: "income",
        amount: parsedAmount,
        date,
        month,
        note: note.trim() || undefined,
        ...(selectedIncomeSource
          ? { source: { id: selectedIncomeSource.id, name: selectedIncomeSource.name } }
          : {}),
      });
    } else {
      onAdd({ type, amount: parsedAmount, date, month, note: note.trim() || undefined });
    }

    // The edit modal closes on submit; only the add flow keeps the form for the next entry.
    if (!isEditing) reset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-surface-300 bg-surface-100 flex flex-col gap-3 rounded-3xl border-2 p-4"
    >
      <div className="flex flex-wrap items-end gap-2">
        <Select
          aria-label="Tipo de movimiento"
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
          options={typeOptions.map((key) => ({
            value: key,
            label: TRANSACTION_TYPE_LABELS[key],
          }))}
        />
        <Input
          type="number"
          min="0"
          aria-label="Monto"
          value={amount}
          placeholder="0"
          autoComplete="off"
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input
          type="date"
          aria-label="Fecha"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Select
          aria-label="Mes"
          value={month}
          disabled={isEditing}
          onChange={(e) => setMonth(e.target.value)}
          options={monthOptions.map((m) => ({ value: m, label: formatMonth(m) }))}
        />
      </div>

      {type === "expense" && (
        <div className="flex flex-wrap items-end gap-2">
          <Select
            aria-label="Subcategoría"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={[
              { value: NO_CATEGORY, label: "Sin subcategoría" },
              ...categoryOptions.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          {!selectedCategory && (
            <Select
              aria-label="Bucket"
              value={bucket}
              onChange={(e) => setBucket(e.target.value as ExpenseBucketKey)}
              options={[
                { value: "fixed", label: BUCKET_LABELS.fixed },
                { value: "variable", label: BUCKET_LABELS.variable },
              ]}
            />
          )}
          {showPayFromSavings && (
            <label className="text-ink-700 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={payFromSavings}
                onChange={(e) => setPayFromSavings(e.target.checked)}
                className="accent-brand-500 h-4 w-4"
              />
              Pagar desde ahorros
            </label>
          )}
        </div>
      )}

      {type === "income" && (
        <div className="flex flex-wrap items-end gap-2">
          <Select
            aria-label="Fuente"
            value={incomeSourceId}
            onChange={(e) => setIncomeSourceId(e.target.value)}
            options={[
              { value: NO_CATEGORY, label: "Sin fuente" },
              ...incomeSourceOptions.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </div>
      )}

      {type === "savings" && (
        <div className="flex flex-wrap items-end gap-2">
          <Select
            aria-label="Origen del ahorro"
            value={sourceCategoryId}
            onChange={(e) => setSourceCategoryId(e.target.value)}
            options={[
              { value: NO_CATEGORY, label: "Sin origen" },
              ...categoryOptions.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      )}

      <Input
        aria-label="Nota"
        value={note}
        placeholder="Nota (opcional)"
        autoComplete="off"
        onChange={(e) => setNote(e.target.value)}
      />

      <Button type="submit" variant="primary">
        {isEditing ? "Guardar cambios" : "Agregar movimiento"}
      </Button>
    </form>
  );
}

/** Appends the transaction's own category snapshot when the live budget no longer
 *  has it (passive orphan rule), so edit mode can still show and keep it. */
function withSnapshotOption(
  options: ExpenseCategoryOption[],
  tx: FinanceV2Transaction | undefined
): ExpenseCategoryOption[] {
  const snapshot =
    tx?.type === "expense" && tx.category
      ? { ...tx.category, bucket: tx.bucket }
      : tx?.type === "savings"
        ? tx.sourceCategory
        : undefined;
  if (!snapshot || options.some((o) => o.id === snapshot.id)) return options;
  return [...options, snapshot];
}

/** `withSnapshotOption`'s counterpart for an income's `source`. */
function withIncomeSnapshotOption(
  options: TransactionCategoryRef[],
  tx: FinanceV2Transaction | undefined
): TransactionCategoryRef[] {
  const snapshot = tx?.type === "income" ? tx.source : undefined;
  if (!snapshot || options.some((o) => o.id === snapshot.id)) return options;
  return [...options, snapshot];
}
