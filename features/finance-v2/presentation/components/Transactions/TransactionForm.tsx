"use client";

import { useState } from "react";
import type { ExpenseBucketKey, ExpenseCategoryOption } from "@/features/finance-v2/domain";
import { toLocalISODate } from "@/features/finance-v2/domain";
import type { NewTransactionInput } from "../../hooks/useFinanceV2Transactions";
import { Button, Input, Select } from "@/shared/components";
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_ORDER } from "./transactionLabels";
import { BUCKET_LABELS } from "../bucketLabels";

type TransactionType = (typeof TRANSACTION_TYPE_ORDER)[number];

const NO_CATEGORY = "";

interface Props {
  month: string;
  categoryOptions: ExpenseCategoryOption[];
  onAdd: (input: NewTransactionInput) => void;
}

/** Calendar bounds of `month` (`YYYY-MM`) for the date input's `min`/`max` — a
 *  presentational guard alongside the domain-level month check in
 *  `addTransaction`, not a third place that DERIVES a month string from a date. */
function monthBounds(month: string): { min: string; max: string } {
  const [year, monthNum] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNum, 0).getDate();
  return { min: `${month}-01`, max: `${month}-${String(lastDay).padStart(2, "0")}` };
}

// Choosing a subcategory HIDES the bucket select entirely: bucket is unaskable twice
// because the control simply isn't rendered, not because it's disabled.
export function TransactionForm({ month, categoryOptions, onAdd }: Props) {
  const { min, max } = monthBounds(month);
  const today = toLocalISODate(new Date());
  const defaultDate = today >= min && today <= max ? today : min;

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [bucket, setBucket] = useState<ExpenseBucketKey>("fixed");
  const [categoryId, setCategoryId] = useState(NO_CATEGORY);

  const selectedCategory = categoryOptions.find((c) => c.id === categoryId) ?? null;

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
      const resolvedBucket = selectedCategory ? selectedCategory.bucket : bucket;
      onAdd({
        type: "expense",
        amount: parsedAmount,
        date,
        note: note.trim() || undefined,
        bucket: resolvedBucket,
        category: selectedCategory ? { id: selectedCategory.id, name: selectedCategory.name } : null,
      });
    } else {
      onAdd({ type, amount: parsedAmount, date, note: note.trim() || undefined });
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
          min={min}
          max={max}
          onChange={(e) => setDate(e.target.value)}
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
