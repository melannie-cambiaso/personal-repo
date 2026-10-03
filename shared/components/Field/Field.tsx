export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-brown-500 text-sm">{label}</span>
      {children}
    </label>
  );
}
