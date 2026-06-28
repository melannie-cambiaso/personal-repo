"use client";

interface Props {
  month: string;
  onChange: (month: string) => void;
}

function prevMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year!, m! - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 7);
}

function nextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year!, m! - 1, 1);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 7);
}

export function ActivityLogMonthNav({ month, onChange }: Props) {
  const label = new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T12:00:00`));

  return (
    <div className="mb-6 flex items-center justify-between">
      <button
        type="button"
        onClick={() => onChange(prevMonth(month))}
        className="cursor-pointer rounded-lg border border-cream-400 px-3 py-1.5 text-sm text-brown-600 transition-colors hover:border-brown-400 hover:text-brown-900"
      >
        ← Anterior
      </button>
      <span className="font-dancing text-xl font-bold capitalize text-brown-900">{label}</span>
      <button
        type="button"
        onClick={() => onChange(nextMonth(month))}
        className="cursor-pointer rounded-lg border border-cream-400 px-3 py-1.5 text-sm text-brown-600 transition-colors hover:border-brown-400 hover:text-brown-900"
      >
        Siguiente →
      </button>
    </div>
  );
}
