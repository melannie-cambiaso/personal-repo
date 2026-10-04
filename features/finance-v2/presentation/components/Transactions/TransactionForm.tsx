"use client";

import { useState } from "react";
import type {
  ExpenseBucketKey,
  ExpenseCategoryOption,
  FinanceV2Transaction,
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
  hasEnvelope: boolean;
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
  hasEnvelope,
  initialTransaction,
  onAdd,
}: Props) {
  const isEditing = initialTransaction !== undefined;
  // A snapshotted category that no longer exists in the budget stays selectable
  // while editing, so saving an unrelated field doesn't silently drop it.
  const categoryOptions = withSnapshotOption(liveCategoryOptions, initialTransaction);
  const monthOptions = monthWindow(viewedMonth, MONTH_RADIUS);
  // The form only offers a transfer once an envelope exists (spec) — or when
  // editing an existing transfer.
  const typeOptions: TransactionType[] =
    hasEnvelope || initialTransaction?.type === "transfer"
      ? [...TRANSACTION_TYPE_ORDER, "transfer"]
      : TRANSACTION_TYPE_ORDER;

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
  // Separate from `categoryId` on purpose (design D3): `type` switching does NOT
  // reset either id, only submit does — sharing one id would let an expense pick
  // silently reappear as a savings source (or vice versa) after switching type.
  const [sourceCategoryId, setSourceCategoryId] = useState(
    initialTransaction?.type === "savings"
      ? (initialTransaction.sourceCategory?.id ?? NO_CATEGORY)
      : NO_CATEGORY
  );

  const selectedCategory = categoryOptions.find((c) => c.id === categoryId) ?? null;
  const selectedSourceCategory = categoryOptions.find((c) => c.id === sourceCategoryId) ?? null;

  // `date` and `month` are NOT reset — sticky like `type` (design decision #6): filing
  // several transactions into the same other month shouldn't require re-picking each time.
  const reset = () => {
    setAmount("");
    setNote("");
    setCategoryId(NO_CATEGORY);
    setBucket("fixed");
    setSourceCategoryId(NO_CATEGORY);
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
    } else {
      onAdd({ type, amount: parsedAmount, date, month, note: note.trim() || undefined });
    }

    // The edit modal closes on submit; only the add flow keeps the form for the next entry.
    if (!isEditing) reset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-sage-300 bg-sage-100 flex flex-col gap-3 rounded-3xl border-2 p-4"
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
