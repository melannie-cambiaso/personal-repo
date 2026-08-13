import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFinanceV2Pending } from "./useFinanceV2Pending";
import type { PendingOverrides } from "@/features/finance-v2/domain";

const onSave = vi.fn();
const onLoad = vi.fn();

/** A promise whose resolution is controlled from the test body — used to assert
 *  behaviour WHILE a `handleLoadPendingOverrides` call is still in flight. */
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useFinanceV2Pending", () => {
  beforeEach(() => {
    onSave.mockReset();
    onLoad.mockReset();
    onLoad.mockResolvedValue({});
  });

  it("initializes overrides from initialOverrides and reports not loading", () => {
    const initialOverrides: PendingOverrides = { c1: 12000 };
    const { result } = renderHook(() =>
      useFinanceV2Pending({ initialOverrides, viewedMonth: "2026-07", onSave, onLoad })
    );

    expect(result.current.overrides).toEqual(initialOverrides);
    expect(result.current.isLoadingPending).toBe(false);
  });

  it("setOverride clamps a negative raw input to 0, updates state, and persists against the loaded month", () => {
    const { result } = renderHook(() =>
      useFinanceV2Pending({ initialOverrides: {}, viewedMonth: "2026-07", onSave, onLoad })
    );

    act(() => result.current.setOverride("c1", "-500"));

    expect(result.current.overrides).toEqual({ c1: 0 });
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith("2026-07", { c1: 0 });
  });

  it("setOverride replaces an existing entry rather than merging a delta", () => {
    const { result } = renderHook(() =>
      useFinanceV2Pending({
        initialOverrides: { c1: 30000 },
        viewedMonth: "2026-07",
        onSave,
        onLoad,
      })
    );

    act(() => result.current.setOverride("c1", "12000"));

    expect(result.current.overrides).toEqual({ c1: 12000 });
  });

  it("does not use a stale closure across successive setOverride calls", () => {
    const { result } = renderHook(() =>
      useFinanceV2Pending({ initialOverrides: {}, viewedMonth: "2026-07", onSave, onLoad })
    );

    act(() => {
      result.current.setOverride("c1", "1000");
      result.current.setOverride("c2", "2000");
    });

    expect(result.current.overrides).toEqual({ c1: 1000, c2: 2000 });
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith("2026-07", { c1: 1000, c2: 2000 });
  });

  it("re-fetches and replaces overrides when viewedMonth changes", async () => {
    const augustOverrides: PendingOverrides = { c2: 5000 };
    onLoad.mockResolvedValueOnce(augustOverrides);

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Pending({ initialOverrides: { c1: 12000 }, viewedMonth, onSave, onLoad }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    expect(result.current.overrides).toEqual({ c1: 12000 });

    await act(async () => {
      rerender({ viewedMonth: "2026-08" });
      await Promise.resolve();
    });

    expect(onLoad).toHaveBeenCalledWith("2026-08");
    expect(result.current.overrides).toEqual(augustOverrides);
  });

  it("isLoadingPending is true in the render triggered by a viewedMonth change, before the load effect resolves", async () => {
    const deferred = createDeferred<PendingOverrides>();
    onLoad.mockReturnValueOnce(deferred.promise);

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Pending({ initialOverrides: {}, viewedMonth, onSave, onLoad }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    act(() => {
      rerender({ viewedMonth: "2026-08" });
    });

    expect(result.current.isLoadingPending).toBe(true);

    await act(async () => {
      deferred.resolve({});
      await deferred.promise;
    });

    expect(result.current.isLoadingPending).toBe(false);
  });

  it("ordering guard: a superseded in-flight response resolving after a newer one does not win", async () => {
    const augustDeferred = createDeferred<PendingOverrides>();
    const septemberDeferred = createDeferred<PendingOverrides>();
    const augustOverrides: PendingOverrides = { aug: 111 };
    const septemberOverrides: PendingOverrides = { sep: 222 };
    onLoad.mockReturnValueOnce(augustDeferred.promise);
    onLoad.mockReturnValueOnce(septemberDeferred.promise);

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Pending({ initialOverrides: {}, viewedMonth, onSave, onLoad }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    act(() => {
      rerender({ viewedMonth: "2026-08" });
    });
    act(() => {
      rerender({ viewedMonth: "2026-09" });
    });

    await act(async () => {
      septemberDeferred.resolve(septemberOverrides);
      await septemberDeferred.promise;
    });
    await act(async () => {
      augustDeferred.resolve(augustOverrides);
      await augustDeferred.promise;
    });

    expect(result.current.overrides).toEqual(septemberOverrides);
  });

  it("a rejected onLoad applies an empty override map instead of leaving the previous month's overrides rendered", async () => {
    onLoad.mockRejectedValueOnce(new Error("transport failure"));

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Pending({ initialOverrides: { c1: 12000 }, viewedMonth, onSave, onLoad }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    await act(async () => {
      rerender({ viewedMonth: "2026-08" });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.overrides).toEqual({});
  });

  it("setOverride during a pending load persists against the previously loaded month, not the requested one", async () => {
    const deferred = createDeferred<PendingOverrides>();
    onLoad.mockReturnValueOnce(deferred.promise);

    const { result, rerender } = renderHook(
      ({ viewedMonth }) =>
        useFinanceV2Pending({ initialOverrides: {}, viewedMonth, onSave, onLoad }),
      { initialProps: { viewedMonth: "2026-07" } }
    );

    act(() => {
      rerender({ viewedMonth: "2026-08" });
    });

    act(() => result.current.setOverride("c1", "9000"));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith("2026-07", { c1: 9000 });

    await act(async () => {
      deferred.resolve({});
      await deferred.promise;
    });
  });
});
