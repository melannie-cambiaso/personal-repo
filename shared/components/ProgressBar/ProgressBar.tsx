interface Props {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={`bg-cream-200 h-2 w-full overflow-hidden rounded-full ${className ?? ""}`}>
      <div className="bg-brown-800 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
