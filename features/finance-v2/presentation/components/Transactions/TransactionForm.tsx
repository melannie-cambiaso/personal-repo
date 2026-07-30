"use client";

import { useState } from "react";
import type {
  ExpenseBucketKey,
  ExpenseCategoryOption,
  TransactionCategoryRef,
} from "@/features/finance-v2/domain";
import { toLocalISODate } from "@/features/finance-v2/domain";
import { monthWindow } from "@/shared/utils/monthUtils";
import { formatMonth } from "@/shared/utils/formatMonth";
import type { NewTransactionInput } from "../../hooks/useFinanceV2Transactions";
import { Button, Input, Select } from "@/shared/components";
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_ORDER } from "./transactionLabels";
import { BUCKET_LABELS } from "../bucketLabels";

type TransactionType = (typeof TRANSACTION_TYPE_ORDER)[number];

const NO_CATEGORY = "";

/** How many months on each side of `viewedMonth` the month picker offers — a
 *  finance-v2 product rule, so it lives at the call site (this used to be where
 *  `monthBounds` lived), not inside the generic `monthWindow` helper. */
const MONTH_RADIUS = 3;

interface Props {
  viewedMonth: string;
  categoryOptions: ExpenseCategoryOption[];
  savingsCategoryOptions: TransactionCategoryRef[];
  onAdd: (input: NewTransactionInput) => void;
}

// Choosing a subcategory HIDES the bucket select entirely: bucket is unaskable twice
// because the control simply isn't rendered, not because it's disabled.
export function TransactionForm({
  viewedMonth,
  categoryOptions,
  savingsCategoryOptions,
  onAdd,
}: Props) {
  const monthOptions = monthWindow(viewedMonth, MONTH_RADIUS);

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => toLocalISODate(new Date()));
  const [month, setMonth] = useState(viewedMonth);
  const [note, setNote] = useState("");
  const [bucket, setBucket] = useState<ExpenseBucketKey>("fixed");
  const [categoryId, setCategoryId] = useState(NO_CATEGORY);

  // Only used to decide whether the category `<Select>`/Bucket toggle should render for the
  // CURRENT `type` — the actual expense/savings category refs submitted below are looked up
  // separately in `handleSubmit`, each against its own correctly-typed options list.
  const activeCategoryOptions: TransactionCategoryRef[] =
    type === "expense" ? categoryOptions : type === "savings" ? savingsCategoryOptions : [];
  const selectedCategory = activeCategoryOptions.find((c) => c.id === categoryId) ?? null;

  // `date` and `month` are NOT reset — sticky like `type` (design decision #6): filing
  // several transactions into the same other month shouldn't require re-picking each time.
  const reset = () => {
    setAmount("");
    setNote("");
    setCategoryId(NO_CATEGORY);
    setBucket("fixed");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    if (type === "expense") {
      const selectedExpenseCategory = categoryOptions.find((c) => c.id === categoryId) ?? null;
      const resolvedBucket = selectedExpenseCategory ? selectedExpenseCategory.bucket : bucket;
      onAdd({
        type: "expense",
        amount: parsedAmount,
        date,
        month,
        note: note.trim() || undefined,
        bucket: resolvedBucket,
        category: selectedExpenseCategory
          ? { id: selectedExpenseCategory.id, name: selectedExpenseCategory.name }
          : null,
      });
    } else if (type === "savings") {
      const selectedSavingsCategory =
        savingsCategoryOptions.find((c) => c.id === categoryId) ?? null;
      onAdd({
        type: "savings",
        amount: parsedAmount,
        date,
        month,
        note: note.trim() || undefined,
        category: selectedSavingsCategory,
      });
    } else {
      onAdd({ type, amount: parsedAmount, date, month, note: note.trim() || undefined });
    }

    reset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4"
    >
      <div className="flex flex-wrap items-end gap-2">
        <Select
          aria-label="Tipo de movimiento"
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
          options={TRANSACTION_TYPE_ORDER.map((key) => ({
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
          onChange={(e) => setMonth(e.target.value)}
          options={monthOptions.map((m) => ({ value: m, label: formatMonth(m) }))}
        />
      </div>

      {(type === "expense" || type === "savings") && (
        <div className="flex flex-wrap items-end gap-2">
          <Select
            aria-label="Subcategoría"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={[
              { value: NO_CATEGORY, label: "Sin subcategoría" },
              ...activeCategoryOptions.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          {type === "expense" && !selectedCategory && (
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

      <Input
        aria-label="Nota"
        value={note}
        placeholder="Nota (opcional)"
        autoComplete="off"
        onChange={(e) => setNote(e.target.value)}
      />

      <Button type="submit" variant="primary">
        Agregar movimiento
      </Button>
    </form>
  );
}
