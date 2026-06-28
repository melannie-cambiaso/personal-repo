export const inputClass =
  "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";

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
