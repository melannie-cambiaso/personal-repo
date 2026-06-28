"use client";

import { useEffect, useRef } from "react";

const MAX_WIDTH_CLASS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
} as const;

interface Props {
  isOpen: boolean;
  onCancel: () => void;
  children: React.ReactNode;
  maxWidth?: keyof typeof MAX_WIDTH_CLASS;
  disableBackdropClose?: boolean;
}

export function ModalShell({
  isOpen,
  onCancel,
  children,
  maxWidth = "md",
  disableBackdropClose = false,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    isOpen ? dialog.showModal() : dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={`m-auto w-full ${MAX_WIDTH_CLASS[maxWidth]} rounded-2xl bg-cream-50 p-0 shadow-card-hover backdrop:bg-brown-900/40`}
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      onClick={
        disableBackdropClose
          ? undefined
          : (e) => { if (e.target === dialogRef.current) onCancel(); }
      }
    >
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
