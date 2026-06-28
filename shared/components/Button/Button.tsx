import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onPress?: () => void;
  className: "secondary" | "primary";
  type: any;
  disabled?: boolean;
}

const btnSecondary =
  "cursor-pointer rounded-lg border border-brown-300 px-4 py-2 text-2xs font-bold text-brown-600 transition-colors hover:bg-cream-300";
const btnPrimary =
  "cursor-pointer rounded-lg bg-brown-800 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-brown-700 disabled:opacity-50";

export const Button = ({ onPress, children, className, type, disabled }: Props) => {
  const newClassName = className === "primary" ? btnPrimary : btnSecondary;

  return (
    <button disabled={disabled} type={type} onClick={onPress} className={newClassName}>
      {children}
    </button>
  );
};
