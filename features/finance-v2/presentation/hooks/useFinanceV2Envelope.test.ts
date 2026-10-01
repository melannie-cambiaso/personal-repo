import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFinanceV2Envelope } from "./useFinanceV2Envelope";
import type { EnvelopeConfig } from "@/features/finance-v2/domain";

const onSaveConfig = vi.fn();
const onLoadCarriedBalance = vi.fn();

const config: EnvelopeConfig = {
  name: "Servicios",
  boundCategoryId: "cuentas",
  openingBalance: 30_000,
  openingMonth: "2026-10",
};

/** A promise whose resolution is controlled from the test body — used to assert
 *  behaviour WHILE a carried-balance load (or a config save) is still in flight. */
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Lets every pending promise chain (save → load → apply) settle inside `act`. */
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

interface Props {
  initialConfig: EnvelopeConfig | null;
  initialCarriedIn: number | null;
  viewedMonth: string;
}

const renderEnvelope = (initialProps: Props) =>
  renderHook(
    (props: Props) => useFinanceV2Envelope({ ...props, onSaveConfig, onLoadCarriedBalance }),
    { initialProps }
  );

describe("useFinanceV2Envelope", () => {
  beforeEach(() => {
    onSaveConfig.mockReset();
    onLoadCarriedBalance.mockReset();
    onLoadCarriedBalance.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts from the server-loaded config and carried balance without fetching", async () => {
    const { result } = renderEnvelope({
      initialConfig: config,
      initialCarriedIn: 7000,
      viewedMonth: "2026-11",
    });
    await flush();

    expect(result.current.config).toEqual(config);
    expect(result.current.carriedIn).toBe(7000);
    expect(result.current.isLoadingCarried).toBe(false);
    expect(onLoadCarriedBalance).not.toHaveBeenCalled();
  });

  it("with no config never calls the loader and exposes no carried balance", async () => {
    const { result, rerender } = renderEnvelope({
      initialConfig: null,
      initialCarriedIn: null,
      viewedMonth: "2026-11",
    });

    rerender({ initialConfig: null, initialCarriedIn: null, viewedMonth: "2026-12" });
    act(() => result.current.refreshCarried());
    await flush();

    expect(onLoadCarriedBalance).not.toHaveBeenCalled();
    expect(result.current.carriedIn).toBeNull();
    expect(result.current.isLoadingCarried).toBe(false);
  });

  it("re-fetches the carried balance when viewedMonth changes", async () => {
    onLoadCarriedBalance.mockResolvedValueOnce(12_000);
    const { result, rerender } = renderEnvelope({
      initialConfig: config,
      initialCarriedIn: 7000,
      viewedMonth: "2026-11",
    });

    rerender({ initialConfig: config, initialCarriedIn: 7000, viewedMonth: "2026-12" });
    await flush();

    expect(onLoadCarriedBalance).toHaveBeenCalledOnce();
    expect(onLoadCarriedBalance).toHaveBeenCalledWith("2026-12");
    expect(result.current.carriedIn).toBe(12_000);
    expect(result.current.isLoadingCarried).toBe(false);
  });

  it("isLoadingCarried is already true in the very render triggered by a viewedMonth change", async () => {
    const deferred = createDeferred<number | null>();
    onLoadCarriedBalance.mockReturnValueOnce(deferred.promise);
    const renders: { viewedMonth: string; isLoadingCarried: boolean }[] = [];

    const { rerender } = renderHook(
      ({ viewedMonth }: { viewedMonth: string }) => {
        const result = useFinanceV2Envelope({
          initialConfig: config,
          initialCarriedIn: 7000,
          viewedMonth,
          onSaveConfig,
          onLoadCarriedBalance,
        });
        renders.push({ viewedMonth, isLoadingCarried: result.isLoadingCarried });
        return result;
      },
      { initialProps: { viewedMonth: "2026-11" } }
    );

    act(() => {
      rerender({ viewedMonth: "2026-12" });
    });

    // Same no-stale-gap contract as `useFinanceV2Transactions`' `isLoadingMonth`: the
    // first render for the new month must already report loading, before the effect runs.
    const firstDecemberRender = renders.find((r) => r.viewedMonth === "2026-12");
    expect(firstDecemberRender?.isLoadingCarried).toBe(true);

    await act(async () => {
      deferred.resolve(1);
      await deferred.promise;
    });
  });

  it("ordering guard: an older in-flight response resolving after a newer one does not win", async () => {
    const decemberDeferred = createDeferred<number | null>();
    const januaryDeferred = createDeferred<number | null>();
    onLoadCarriedBalance.mockReturnValueOnce(decemberDeferred.promise);
    onLoadCarriedBalance.mockReturnValueOnce(januaryDeferred.promise);
    const { result, rerender } = renderEnvelope({
      initialConfig: config,
      initialCarriedIn: 7000,
      viewedMonth: "2026-11",
    });

    rerender({ initialConfig: config, initialCarriedIn: 7000, viewedMonth: "2026-12" });
    await flush();
    rerender({ initialConfig: config, initialCarriedIn: 7000, viewedMonth: "2027-01" });
    await flush();

    await act(async () => {
      januaryDeferred.resolve(222);
      await januaryDeferred.promise;
    });
    await act(async () => {
      decemberDeferred.resolve(111);
      await decemberDeferred.promise;
    });

    expect(result.current.carriedIn).toBe(222);
    expect(result.current.isLoadingCarried).toBe(false);
  });

  it("A->B->A round trip: navigating back before B resolves keeps A's value and drops B's late response", async () => {
    const decemberDeferred = createDeferred<number | null>();
    onLoadCarriedBalance.mockReturnValueOnce(decemberDeferred.promise);
    const { result, rerender } = renderEnvelope({
      initialConfig: config,
      initialCarriedIn: 7000,
      viewedMonth: "2026-11",
    });

    rerender({ initialConfig: config, initialCarriedIn: 7000, viewedMonth: "2026-12" });
    await flush();
    rerender({ initialConfig: config, initialCarriedIn: 7000, viewedMonth: "2026-11" });

    expect(onLoadCarriedBalance).toHaveBeenCalledOnce();
    expect(result.current.carriedIn).toBe(7000);
    expect(result.current.isLoadingCarried).toBe(false);

    await act(async () => {
      decemberDeferred.resolve(111);
      await decemberDeferred.promise;
    });

    expect(result.current.carriedIn).toBe(7000);
  });

  it("a rejected load exposes null and logs the error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    onLoadCarriedBalance.mockRejectedValueOnce(new Error("transport failure"));
    const { result, rerender } = renderEnvelope({
      initialConfig: config,
      initialCarriedIn: 7000,
      viewedMonth: "2026-11",
    });

    rerender({ initialConfig: config, initialCarriedIn: 7000, viewedMonth: "2026-12" });
    await flush();

    expect(result.current.carriedIn).toBeNull();
    expect(result.current.isLoadingCarried).toBe(false);
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("refreshCarried re-fetches the viewed month's carried balance", async () => {
    onLoadCarriedBalance.mockResolvedValueOnce(5000);
    const { result } = renderEnvelope({
      initialConfig: config,
      initialCarriedIn: 7000,
      viewedMonth: "2026-11",
    });

    act(() => result.current.refreshCarried());
    expect(result.current.isLoadingCarried).toBe(true);
    await flush();

    expect(onLoadCarriedBalance).toHaveBeenCalledWith("2026-11");
    expect(result.current.carriedIn).toBe(5000);
    expect(result.current.isLoadingCarried).toBe(false);
  });

  // Spec: "Configuring the envelope".
  it("saveConfig on creation stamps the viewed month as openingMonth and persists the full config", () => {
    const { result } = renderEnvelope({
      initialConfig: null,
      initialCarriedIn: null,
      viewedMonth: "2026-10",
    });

    act(() =>
      result.current.saveConfig({
        name: "Servicios",
        boundCategoryId: "cuentas",
        openingBalance: 30_000,
      })
    );

    const created = { ...config, openingMonth: "2026-10" };
    expect(result.current.config).toEqual(created);
    expect(onSaveConfig).toHaveBeenCalledOnce();
    expect(onSaveConfig).toHaveBeenCalledWith(created);
  });

  it("saveConfig on edit preserves the existing openingMonth, whatever month is viewed", () => {
    const { result } = renderEnvelope({
      initialConfig: config,
      initialCarriedIn: 7000,
      viewedMonth: "2027-03",
    });

    act(() =>
      result.current.saveConfig({ name: "Cuentas fijas", boundCategoryId: "otra", openingBalance: 0 })
    );

    const edited = {
      name: "Cuentas fijas",
      boundCategoryId: "otra",
      openingBalance: 0,
      openingMonth: "2026-10",
    };
    expect(result.current.config).toEqual(edited);
    expect(onSaveConfig).toHaveBeenCalledWith(edited);
  });

  it("does not use a stale closure across a create and an edit in the same tick", () => {
    const { result } = renderEnvelope({
      initialConfig: null,
      initialCarriedIn: null,
      viewedMonth: "2026-10",
    });

    act(() => {
      result.current.saveConfig({ name: "Servicios", boundCategoryId: "cuentas", openingBalance: 1 });
      result.current.saveConfig({ name: "Servicios", boundCategoryId: "cuentas", openingBalance: 2 });
    });

    expect(onSaveConfig).toHaveBeenLastCalledWith({
      name: "Servicios",
      boundCategoryId: "cuentas",
      openingBalance: 2,
      openingMonth: "2026-10",
    });
  });

  it("saveConfig re-fetches the carried balance only AFTER the save has resolved", async () => {
    const save = createDeferred<void>();
    onSaveConfig.mockReturnValueOnce(save.promise);
    onLoadCarriedBalance.mockResolvedValueOnce(30_000);
    const { result } = renderEnvelope({
      initialConfig: null,
      initialCarriedIn: null,
      viewedMonth: "2026-10",
    });

    act(() =>
      result.current.saveConfig({ name: "Servicios", boundCategoryId: "cuentas", openingBalance: 30_000 })
    );
    await flush();

    // A load dispatched before the save lands could read the previous (here: missing) config.
    expect(onLoadCarriedBalance).not.toHaveBeenCalled();
    expect(result.current.isLoadingCarried).toBe(true);

    await act(async () => {
      save.resolve();
      await save.promise;
    });
    await flush();

    expect(onLoadCarriedBalance).toHaveBeenCalledOnce();
    expect(onLoadCarriedBalance).toHaveBeenCalledWith("2026-10");
    expect(result.current.carriedIn).toBe(30_000);
    expect(result.current.isLoadingCarried).toBe(false);
  });
});
