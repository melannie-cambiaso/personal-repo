const inputClass =
  "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={className ? `${inputClass} ${className}` : inputClass} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={className ? `${inputClass} resize-none ${className}` : `${inputClass} resize-none`} {...props} />;
}

interface SelectOption {
  value: string;
  label: string;
}

export function Select({ className, options, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options?: SelectOption[] }) {
  return (
    <select className={className ? `${inputClass} ${className}` : inputClass} {...props}>
      {options ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>) : children}
    </select>
  );
}
