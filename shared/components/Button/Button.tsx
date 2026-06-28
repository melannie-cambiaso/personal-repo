import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onPress?: () => void;
  variant: "primary" | "secondary" | "danger";
  type: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  disabled?: boolean;
}

const variants = {
  primary: "cursor-pointer rounded-lg bg-brown-800 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-brown-700 disabled:opacity-50",
  secondary: "cursor-pointer rounded-lg border border-brown-300 px-4 py-2 text-2xs font-bold text-brown-600 transition-colors hover:bg-cream-300",
  danger: "cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-red-700",
};

export const Button = ({ onPress, children, variant, type, disabled }: Props) => (
  <button disabled={disabled} type={type} onClick={onPress} className={variants[variant]}>
    {children}
  </button>
);
