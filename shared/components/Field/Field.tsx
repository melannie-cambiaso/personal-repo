export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-ink-500 text-sm">{label}</span>
      {children}
    </label>
  );
}
