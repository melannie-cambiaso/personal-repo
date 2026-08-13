"use client";

import { useEffect, useRef, useState } from "react";
import type { PendingOverrides } from "@/features/finance-v2/domain";
import { clampAmount, setPendingOverride as domainSetPendingOverride } from "@/features/finance-v2/domain";

interface Params {
  initialOverrides: PendingOverrides;
  viewedMonth: string;
  onSave: (month: string, overrides: PendingOverrides) => Promise<void> | void;
  onLoad: (month: string) => Promise<PendingOverrides>;
}

// Mirrors `useFinanceV2Transactions`: `loadedMonthRef` + `requestIdRef` race guard so a
// stale in-flight response for an abandoned month can never overwrite a newer one;
// `overridesRef` avoids stale closures across successive `setOverride` calls (same
// `persist`-via-ref pattern used across finance-v2 hooks). Fire-and-forget persist on
// every edit, same as `useFinanceV2Budget`.
export function useFinanceV2Pending({ initialOverrides, viewedMonth, onSave, onLoad }: Params) {
  const [overrides, setOverrides] = useState<PendingOverrides>(initialOverrides);
  const overridesRef = useRef(initialOverrides);

  // The month `overridesRef.current` actually belongs to — NOT necessarily `viewedMonth`,
  // which may already point at a month whose load is still in flight. `setOverride`
  // persists against this ref, never against `viewedMonth` directly, so an edit made
  // during a pending load can never write month A's override into month B's key.
  const loadedMonthRef = useRef(viewedMonth);
  const requestIdRef = useRef(0);
  // Derived at render time (not via a `useEffect`-flipped `useState`) so this render
  // never reports "ready" while `overrides` still holds the previous month's data —
  // same reasoning as `useFinanceV2Transactions.isLoadingMonth`.
  const isLoadingPending = loadedMonthRef.current !== viewedMonth;

  useEffect(() => {
    if (loadedMonthRef.current === viewedMonth) return; // mount + every unrelated re-render

    const month = viewedMonth;
    const requestId = ++requestIdRef.current;

    const apply = (next: PendingOverrides) => {
      if (requestId !== requestIdRef.current) return; // superseded — drop silently
      loadedMonthRef.current = month;
      overridesRef.current = next;
      setOverrides(next);
    };

    void onLoad(month).then(apply, (error) => {
      console.error(`useFinanceV2Pending: failed to load month "${month}"`, error);
      apply({});
    });

    return () => {
      requestIdRef.current = requestId + 1;
    };
  }, [viewedMonth, onLoad]);

  const setOverride = (leafId: string, raw: string | number) => {
    const next = domainSetPendingOverride(overridesRef.current, { leafId, amount: clampAmount(raw) });
    overridesRef.current = next;
    setOverrides(next);
    void onSave(loadedMonthRef.current, next);
  };

  return { overrides, setOverride, isLoadingPending };
}
