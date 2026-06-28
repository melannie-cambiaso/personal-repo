interface Props {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-cream-200 ${className ?? ""}`}
    >
      <div
        className="h-2 rounded-full bg-brown-800 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
