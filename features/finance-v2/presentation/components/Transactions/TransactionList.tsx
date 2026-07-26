import type { DayGroup } from "@/features/finance-v2/domain";
import { TransactionRow } from "./TransactionRow";

interface Props {
  dayGroups: DayGroup[];
  onDelete: (id: string) => void;
}

// Purely presentational — renders `dayGroups` in the order given. Ordering (day desc,
// reverse insertion order within a day) is entirely `groupTransactionsByDay`'s job; this
// component never re-sorts.
export function TransactionList({ dayGroups, onDelete }: Props) {
  if (dayGroups.length === 0) {
    return <p className="text-brown-500 text-sm">No hay movimientos este mes</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {dayGroups.map((group) => (
        <div key={group.date} className="border-cream-300 rounded-xl border bg-white p-4">
          <p className="text-brown-500 mb-2 text-xs font-semibold">{group.date}</p>
          <div className="flex flex-col gap-3">
            {group.transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
