import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onPress?: () => void;
  variant: "primary" | "secondary" | "danger";
  type: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  disabled?: boolean;
}

const variants = {
  primary:
    "cursor-pointer rounded-full border-2 border-brown-900 bg-brown-900 px-5 py-2 text-sm text-cream-50 transition-colors hover:bg-brown-800 disabled:opacity-50",
  secondary:
    "cursor-pointer rounded-full border-2 border-brown-800 bg-cream-50 px-5 py-2 text-sm text-brown-900 transition-colors hover:bg-cream-200 disabled:opacity-50",
  danger:
    "cursor-pointer rounded-full border-2 border-red-600 bg-red-600 px-5 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50",
};

export const Button = ({ onPress, children, variant, type, disabled }: Props) => (
  <button disabled={disabled} type={type} onClick={onPress} className={variants[variant]}>
    {children}
  </button>
);
