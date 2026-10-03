interface Props {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={`bg-cream-300 h-2.5 w-full overflow-hidden rounded-full ${className ?? ""}`}>
      <div className="bg-sage-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
