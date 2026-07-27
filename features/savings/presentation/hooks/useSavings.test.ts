import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSavings } from "./useSavings";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import type { SavingsPeriod } from "@/features/savings/domain/SavingsPeriod";

const onSave = vi.fn();

const makeEntry = (overrides: Partial<SavingsEntry> = {}): SavingsEntry => ({
  id: crypto.randomUUID(),
  type: "deposito",
  amount: 100,
  date: "2026-06-01",
  toReplenish: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("useSavings", () => {
  it("exposes sorted entries date DESC", () => {
    const entries = [
      makeEntry({ date: "2026-06-01", createdAt: "2026-06-01T10:00:00Z" }),
      makeEntry({ date: "2026-06-03", createdAt: "2026-06-03T10:00:00Z" }),
      makeEntry({ date: "2026-06-02", createdAt: "2026-06-02T10:00:00Z" }),
    ];
    const { result } = renderHook(() => useSavings({ initialEntries: entries, onSave }));
    expect(result.current.entries[0].date).toBe("2026-06-03");
    expect(result.current.entries[2].date).toBe("2026-06-01");
  });

  it("computes balance correctly", () => {
    const entries = [
      makeEntry({ type: "deposito", amount: 500 }),
      makeEntry({ type: "gasto", amount: 200 }),
    ];
    const { result } = renderHook(() => useSavings({ initialEntries: entries, onSave }));
    expect(result.current.balance).toBe(300);
  });

  it("computes totalToReplenish correctly", () => {
    const entries = [
      makeEntry({ type: "gasto", amount: 150, toReplenish: true }),
      makeEntry({ type: "gasto", amount: 100, toReplenish: false }),
    ];
    const { result } = renderHook(() => useSavings({ initialEntries: entries, onSave }));
    expect(result.current.totalToReplenish).toBe(150);
  });

  it("addEntry calls onSave and updates state", () => {
    const { result } = renderHook(() => useSavings({ initialEntries: [], onSave }));
    const entry = makeEntry();
    act(() => result.current.addEntry(entry));
    expect(result.current.entries).toHaveLength(1);
    expect(onSave).toHaveBeenCalled();
  });

  it("addEntry forces toReplenish=false for depósito", () => {
    const { result } = renderHook(() => useSavings({ initialEntries: [], onSave }));
    act(() =>
      result.current.addEntry(
        makeEntry({ type: "deposito", toReplenish: true as unknown as boolean })
      )
    );
    expect(result.current.entries[0].toReplenish).toBe(false);
  });

  it("deleteEntry removes the entry", () => {
    const entry = makeEntry();
    const { result } = renderHook(() => useSavings({ initialEntries: [entry], onSave }));
    act(() => result.current.deleteEntry(entry.id));
    expect(result.current.entries).toHaveLength(0);
  });

  it("markReplenished sets toReplenish=false without deleting", () => {
    const entry = makeEntry({ type: "gasto", toReplenish: true });
    const { result } = renderHook(() => useSavings({ initialEntries: [entry], onSave }));
    act(() => result.current.markReplenished(entry.id));
    expect(result.current.entries[0].toReplenish).toBe(false);
    expect(result.current.entries).toHaveLength(1);
  });

  it("balance defaults to computeBalance alone when no period is passed", () => {
    const entries = [makeEntry({ type: "deposito", amount: 500 })];
    const { result } = renderHook(() => useSavings({ initialEntries: entries, onSave }));
    expect(result.current.balance).toBe(500);
  });

  it("balance folds the period's initialAmount via computePeriodBalance", () => {
    const period: SavingsPeriod = {
      id: "period-2",
      startedAt: "2026-07-01T00:00:00Z",
      initialAmount: 5000,
    };
    const entries = [
      makeEntry({ type: "deposito", amount: 500 }),
      makeEntry({ type: "gasto", amount: 200 }),
    ];
    const { result } = renderHook(() => useSavings({ initialEntries: entries, onSave, period }));
    expect(result.current.balance).toBe(5300);
  });

  it("addEntry never leaks entries outside the scoped active period into onSave", () => {
    const activeOnly = [makeEntry({ id: "active-1" })];
    const { result } = renderHook(() =>
      useSavings({ initialEntries: activeOnly, onSave })
    );
    const newEntry = makeEntry({ id: "active-2" });
    act(() => result.current.addEntry(newEntry));
    const savedEntries = onSave.mock.calls[onSave.mock.calls.length - 1][0] as SavingsEntry[];
    expect(savedEntries.map((e) => e.id).sort()).toEqual(["active-1", "active-2"]);
  });
});
