const inputClass =
  "w-full rounded-xl border-2 border-cream-400 bg-cream-50 px-3 py-2 text-base text-brown-900 outline-none transition-colors placeholder:text-brown-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-300";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={className ? `${inputClass} ${className}` : inputClass} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={className ? `${inputClass} resize-none ${className}` : `${inputClass} resize-none`}
      {...props}
    />
  );
}

interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  className,
  options,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options?: SelectOption[] }) {
  return (
    <select className={className ? `${inputClass} ${className}` : inputClass} {...props}>
      {options
        ? options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))
        : children}
    </select>
  );
}
