export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-2xs tracking-store text-brown-400 font-semibold uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
