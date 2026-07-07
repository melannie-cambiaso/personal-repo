"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURE_NAV_ITEMS } from "@/shared/navigation/features";

export function AppNav() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Auto-close on route change: the App Router preserves layout state across
  // navigation, so this layout-mounted drawer would otherwise stay open. This
  // adjusts state during render (React's recommended pattern for resetting
  // state on prop change) instead of a useEffect, to avoid a cascading
  // synchronous setState-in-effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-label="Menú"
        onClick={() => setOpen(true)}
        className="bg-brown-900 text-cream-100 fixed top-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-md lg:hidden"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        className="bg-cream-50 shadow-card-hover backdrop:bg-brown-900/40 m-0 ml-0 h-full max-h-full w-64 max-w-[80vw] p-0"
        style={{ left: 0, top: 0 }}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="flex h-full flex-col px-6 py-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-dancing text-brown-900 text-2xl font-bold">Menú</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-brown-400 hover:text-brown-800 flex h-11 w-11 cursor-pointer items-center justify-center text-xl transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {FEATURE_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brown-900 text-cream-100"
                      : "text-brown-800 hover:bg-cream-200"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </dialog>
    </>
  );
}
