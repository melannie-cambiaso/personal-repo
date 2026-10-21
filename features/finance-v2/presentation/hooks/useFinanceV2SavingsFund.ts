"use client";

import { useEffect, useRef, useState } from "react";
import type { SavingsFundConfig } from "@/features/finance-v2/domain";

/** What the user edits — `openingMonth` is never user-picked (see `saveConfig`). */
export type SavingsFundConfigInput = Omit<SavingsFundConfig, "openingMonth">;

interface Params {
  initialConfig: SavingsFundConfig | null;
  /** Carried-in balance of the initial `viewedMonth`, loaded by the RSC so the first
   *  render needs no client fetch. */
  initialCarriedIn: number | null;
  viewedMonth: string;
  onSaveConfig: (config: SavingsFundConfig) => Promise<void> | void;
  onLoadCarriedBalance: (month: string) => Promise<number | null>;
}

/** Identifies what a carried-in value was computed for: the month, plus a revision
 *  bumped by every change that can move it without a month change (a config save, or an
 *  explicit `refreshCarried` after a cross-month save into an earlier month). */
const carriedKey = (month: string, revision: number) => `${month}#${revision}`;

// Mirrors `useFinanceV2Envelope` on purpose (own copy, so the envelope keeps its tests and
// behavior untouched). Only the carried-in balance comes from the server; the viewed
// month's own flows are added by the consumer from the in-memory transaction list.
export function useFinanceV2SavingsFund({
  initialConfig,
  initialCarriedIn,
  viewedMonth,
  onSaveConfig,
  onLoadCarriedBalance,
}: Params) {
  const [config, setConfig] = useState<SavingsFundConfig | null>(initialConfig);
  const configRef = useRef(initialConfig);
  const [revision, setRevision] = useState(0);
  const currentKey = carriedKey(viewedMonth, revision);

  // The value is stored WITH the key it belongs to, so `isLoadingCarried` is derived at
  // render time with no stale gap: the render that produces a new month/revision already
  // reads as loading.
  const [carried, setCarried] = useState({
    key: carriedKey(viewedMonth, 0),
    value: initialCarriedIn,
  });

  // Monotonic token for the ordering guard: a late response of an older request is dropped.
  const requestIdRef = useRef(0);
  // Settles once the latest config save has landed. Every carried load chains off it, so a
  // load can never read the previous config (on creation: none at all).
  const pendingSaveRef = useRef<Promise<void>>(Promise.resolve());

  const isLoadingCarried = config !== null && carried.key !== currentKey;
  const carriedIn = config === null ? null : carried.value;

  useEffect(() => {
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
        console.error(
          `useFinanceV2SavingsFund: failed to load carried balance for "${month}"`,
          error
        );
        apply(null);
      });

    return () => {
      requestIdRef.current = requestId + 1;
    };
  }, [config, currentKey, carried.key, viewedMonth, onLoadCarriedBalance]);

  // `openingMonth` is set to the viewed month on creation and preserved on every later edit.
  const saveConfig = (input: SavingsFundConfigInput) => {
    const next: SavingsFundConfig = {
      ...input,
      openingMonth: configRef.current?.openingMonth ?? viewedMonth,
    };
    configRef.current = next;
    setConfig(next);
    pendingSaveRef.current = Promise.resolve(onSaveConfig(next)).catch((error) => {
      console.error("useFinanceV2SavingsFund: failed to save savings fund config", error);
    });
    // `openingBalance`/`openingMonth` feed the carried-in value.
    setRevision((r) => r + 1);
  };

  const refreshCarried = () => setRevision((r) => r + 1);

  return { config, saveConfig, carriedIn, isLoadingCarried, refreshCarried };
}
