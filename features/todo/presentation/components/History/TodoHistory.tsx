import type { TodoHistoryItem } from "@/features/todo/domain/TodoHistoryItem";

interface Props {
  history: TodoHistoryItem[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "hoy";
  if (d.toDateString() === yesterday.toDateString()) return "ayer";
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

export function TodoHistory({ history }: Props) {
  if (history.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-2xs tracking-store text-brown-400 mb-4 font-semibold uppercase">
        Historial
      </h2>
      <ul className="flex flex-col gap-2">
        {history.map((item) => (
          <li
            key={item.id}
            className="border-cream-200 flex items-center justify-between rounded-xl border bg-white px-5 py-3"
          >
            <span className="text-brown-400 text-sm line-through">{item.title}</span>
            <span className="text-brown-400 ml-4 flex shrink-0 gap-2 text-xs">
              <span>{item.completedBy}</span>
              <span>·</span>
              <span>{formatDate(item.completedAt)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
