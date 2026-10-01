"use client";

import { useEffect, useRef, useState } from "react";
import type { EnvelopeConfig } from "@/features/finance-v2/domain";

/** What the user edits — `openingMonth` is never user-picked (see `saveConfig`). */
export type EnvelopeConfigInput = Omit<EnvelopeConfig, "openingMonth">;

interface Params {
  initialConfig: EnvelopeConfig | null;
  /** Carried-in balance of the initial `viewedMonth`, loaded by the RSC so the first
   *  render needs no client fetch. */
  initialCarriedIn: number | null;
  viewedMonth: string;
  onSaveConfig: (config: EnvelopeConfig) => Promise<void> | void;
  onLoadCarriedBalance: (month: string) => Promise<number | null>;
}

/** Identifies what a carried-in value was computed for: the month, plus a revision
 *  bumped by every change that can move it without a month change (a config save, or an
 *  explicit `refreshCarried` after a cross-month save into an earlier month). */
const carriedKey = (month: string, revision: number) => `${month}#${revision}`;

// Fire-and-forget config persist (same `persist*` + ref pattern as `useFinanceV2Budget`).
// Only the carried-in balance comes from the server (design D2): the viewed month's own
// flows are added by the consumer from the in-memory transaction list.
export function useFinanceV2Envelope({
  initialConfig,
  initialCarriedIn,
  viewedMonth,
  onSaveConfig,
  onLoadCarriedBalance,
}: Params) {
  const [config, setConfig] = useState<EnvelopeConfig | null>(initialConfig);
  const configRef = useRef(initialConfig);
  const [revision, setRevision] = useState(0);
  const currentKey = carriedKey(viewedMonth, revision);

  // The value is stored WITH the key it belongs to, so `isLoadingCarried` can be derived
  // at render time with no stale gap (same reasoning as `isLoadingMonth` in
  // `useFinanceV2Transactions`): `carried.key` only changes once `apply` runs, so the
  // render that produces a new month/revision already reads as loading. State instead
  // of a ref, because a ref read during render is what `react-hooks/refs` rejects.
  const [carried, setCarried] = useState({
    key: carriedKey(viewedMonth, 0),
    value: initialCarriedIn,
  });

  // Monotonic token for the ordering guard — identical to `useFinanceV2Transactions`.
  const requestIdRef = useRef(0);
  // Settles once the latest config save has landed. Every carried load chains off it:
  // a load dispatched before the save could read the previous config (on creation:
  // none at all, i.e. `null`) — action dispatch order is not a guarantee to rely on.
  const pendingSaveRef = useRef<Promise<void>>(Promise.resolve());

  const isLoadingCarried = config !== null && carried.key !== currentKey;
  const carriedIn = config === null ? null : carried.value;

  useEffect(() => {
    // No envelope: nothing to load (mount + every unrelated re-render also land here
    // or on the already-loaded check).
    if (config === null || carried.key === currentKey) return;

    const key = currentKey;
    const month = viewedMonth;
    const requestId = ++requestIdRef.current;

    const apply = (value: number | null) => {
      if (requestId !== requestIdRef.current) return; // superseded — drop silently
      setCarried({ key, value });
    };

    void pendingSaveRef.current
      .then(() => onLoadCarriedBalance(month))
      .then(apply, (error) => {
        console.error(`useFinanceV2Envelope: failed to load carried balance for "${month}"`, error);
        apply(null);
      });

    // Same invalidation as `useFinanceV2Transactions`: a newer key (or an unmount)
    // makes this request's late response a no-op.
    return () => {
      requestIdRef.current = requestId + 1;
    };
  }, [config, currentKey, carried.key, viewedMonth, onLoadCarriedBalance]);

  // `openingMonth` is set to the viewed month on creation and preserved on every
  // later edit (spec: set once, never changed).
  const saveConfig = (input: EnvelopeConfigInput) => {
    const next: EnvelopeConfig = {
      ...input,
      openingMonth: configRef.current?.openingMonth ?? viewedMonth,
    };
    configRef.current = next;
    setConfig(next);
    pendingSaveRef.current = Promise.resolve(onSaveConfig(next)).catch((error) => {
      console.error("useFinanceV2Envelope: failed to save envelope config", error);
    });
    // `openingBalance`/`openingMonth` feed the carried-in value.
    setRevision((r) => r + 1);
  };

  const refreshCarried = () => setRevision((r) => r + 1);

  return { config, saveConfig, carriedIn, isLoadingCarried, refreshCarried };
}
