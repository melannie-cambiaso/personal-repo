import type { DayGroup } from "@/features/finance-v2/domain";
import { TransactionRow } from "./TransactionRow";

interface Props {
  dayGroups: DayGroup[];
  onDelete: (id: string) => void;
  envelopeName: string | null;
}

// Purely presentational — renders `dayGroups` in the order given. Ordering (day desc,
// reverse insertion order within a day) is entirely `groupTransactionsByDay`'s job; this
// component never re-sorts.
export function TransactionList({ dayGroups, onDelete, envelopeName }: Props) {
  if (dayGroups.length === 0) {
    return <p className="text-brown-500 text-sm">No hay movimientos este mes</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {dayGroups.map((group) => (
        <div key={group.date} className="border-sage-300 bg-cream-50 rounded-3xl border-2 p-4">
          <p className="bg-sage-300 text-sage-800 font-figure mb-3 w-fit rounded-full px-3 py-0.5 text-xs">
            {group.date}
          </p>
          <div className="flex flex-col gap-3">
            {group.transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                envelopeName={envelopeName}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
