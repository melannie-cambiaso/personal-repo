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
  title?: string;
  maxWidth?: keyof typeof MAX_WIDTH_CLASS;
  disableBackdropClose?: boolean;
}

export function ModalShell({
  isOpen,
  onCancel,
  children,
  title,
  maxWidth = "md",
  disableBackdropClose = false,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) dialog.showModal();
    else dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={`m-auto w-full ${MAX_WIDTH_CLASS[maxWidth]} bg-cream-50 border-cream-400 shadow-card-hover backdrop:bg-brown-900/40 rounded-3xl border-2 p-0`}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={
        disableBackdropClose
          ? undefined
          : (e) => {
              if (e.target === dialogRef.current) onCancel();
            }
      }
    >
      <div className="px-6 py-5">
        {title && (
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-brown-900 text-3xl font-semibold tracking-tight">{title}</h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-brown-400 hover:text-brown-800 cursor-pointer text-xl transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
