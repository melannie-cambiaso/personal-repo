"use client";

import { Suspense, useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FEATURE_NAV_ITEMS,
  SECTION_PARAM,
  resolveSection,
  type FeatureNavItem,
  type FeatureNavSection,
} from "@/shared/navigation/features";

interface SectionLinksProps {
  feature: FeatureNavItem & { sections: readonly FeatureNavSection[] };
  /** Raw `?section=` value, or `null` when the feature route is not the current one. */
  activeRaw: string | null;
  isCurrentRoute: boolean;
  onNavigate: () => void;
}

function SectionLinks({ feature, activeRaw, isCurrentRoute, onNavigate }: SectionLinksProps) {
  const activeKey = isCurrentRoute ? resolveSection(feature.sections, activeRaw) : null;
  return (
    <ul
      aria-label={feature.label}
      className="border-surface-300 ml-5 flex flex-col gap-0.5 border-l-2 pl-2"
    >
      {feature.sections.map((section) => {
        const href = `${feature.href}?${SECTION_PARAM}=${section.key}`;
        const isActive = section.key === activeKey;
        return (
          <li key={section.key}>
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => {
                // Same route: switch section client-side. A `Link` navigation would
                // re-run the dynamic page and reload its data; the native History API
                // still syncs `useSearchParams` (Next.js docs, "Native History API").
                if (isCurrentRoute) {
                  e.preventDefault();
                  window.history.pushState(null, "", href);
                }
                onNavigate();
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isActive ? "bg-brand-100 text-brand-600" : "text-ink-600 hover:bg-surface-200"
              }`}
            >
              <span aria-hidden="true">{section.icon}</span>
              {section.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Split out so only this subtree reads search params: `useSearchParams` needs a Suspense
// boundary on statically rendered routes, and the fallback still renders every link.
function SectionLinksFromParams(props: Omit<SectionLinksProps, "activeRaw">) {
  const searchParams = useSearchParams();
  return <SectionLinks {...props} activeRaw={searchParams.get(SECTION_PARAM)} />;
}

const APP_NAME = "Personal Repo";

// Routes that render without the app chrome (the login screen has nowhere to go yet).
const CHROMELESS_ROUTES = new Set(["/login"]);

const itemClass = (isActive: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
    isActive ? "bg-brand-100 text-brand-600" : "text-ink-700 hover:bg-surface-200"
  }`;

// One `<aside>` serves both layouts: a persistent full-height sidebar from `lg` up, and
// an off-canvas drawer opened from the mobile top bar below it. Rendering it once keeps
// every link unique in the DOM.
export function AppNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const asideId = useId();

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
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (CHROMELESS_ROUTES.has(pathname)) return null;

  const close = () => setOpen(false);

  return (
    <>
      <header className="bg-surface-50 border-surface-300 sticky top-0 z-30 flex items-center gap-3 border-b-2 px-4 py-2 lg:hidden">
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls={asideId}
          onClick={() => setOpen(true)}
          className="text-ink-700 hover:bg-surface-200 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="text-ink-900 text-xl">{APP_NAME}</span>
      </header>

      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={close}
          className="bg-ink-900/40 fixed inset-0 z-40 cursor-default lg:hidden"
        />
      )}

      <aside
        id={asideId}
        className={`bg-surface-50 border-surface-300 fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col overflow-y-auto border-r-2 transition-[transform,visibility] duration-200 lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-56 lg:shrink-0 lg:translate-x-0 ${
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <div className="text-ink-900 border-surface-300 border-b-2 px-5 py-4 text-xl">
          {APP_NAME}
        </div>
        <nav aria-label="Principal" className="flex flex-col gap-1 p-3">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            onClick={close}
            className={itemClass(pathname === "/")}
          >
            <span aria-hidden="true">🏡</span>
            Inicio
          </Link>
          {FEATURE_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const sections = item.sections;
            return (
              <div key={item.href} className="flex flex-col gap-1">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={close}
                  className={itemClass(isActive)}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
                {sections && (
                  <Suspense
                    fallback={
                      <SectionLinks
                        feature={{ ...item, sections }}
                        activeRaw={null}
                        isCurrentRoute={false}
                        onNavigate={close}
                      />
                    }
                  >
                    <SectionLinksFromParams
                      feature={{ ...item, sections }}
                      isCurrentRoute={isActive}
                      onNavigate={close}
                    />
                  </Suspense>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
