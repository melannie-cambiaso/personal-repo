import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFinanceV2SavingsFund } from "./useFinanceV2SavingsFund";
import type { SavingsFundConfig } from "@/features/finance-v2/domain";

const onSaveConfig = vi.fn();
const onLoadCarriedBalance = vi.fn();

const config: SavingsFundConfig = {
  name: "Ahorros",
  openingBalance: 500_000,
  openingMonth: "2026-10",
};

/** A promise whose resolution is controlled from the test body. */
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Lets every pending promise chain (save -> load -> apply) settle inside `act`. */
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

interface Props {
  initialConfig: SavingsFundConfig | null;
  initialCarriedIn: number | null;
  viewedMonth: string;
}

const renderFund = (initialProps: Props) =>
  renderHook(
    (props: Props) => useFinanceV2SavingsFund({ ...props, onSaveConfig, onLoadCarriedBalance }),
    { initialProps }
  );

describe("useFinanceV2SavingsFund", () => {
  beforeEach(() => {
    onSaveConfig.mockReset();
    onLoadCarriedBalance.mockReset();
    onLoadCarriedBalance.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts from the server-loaded config and carried balance without fetching", async () => {
    const { result } = renderFund({
      initialConfig: config,
      initialCarriedIn: 480_000,
      viewedMonth: "2026-11",
    });
    await flush();

    expect(result.current.config).toEqual(config);
    expect(result.current.carriedIn).toBe(480_000);
    expect(result.current.isLoadingCarried).toBe(false);
    expect(onLoadCarriedBalance).not.toHaveBeenCalled();
  });

  it("with no config never calls the loader and exposes no carried balance", async () => {
    const { result, rerender } = renderFund({
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
    onLoadCarriedBalance.mockResolvedValueOnce(450_000);
    const { result, rerender } = renderFund({
      initialConfig: config,
      initialCarriedIn: 480_000,
      viewedMonth: "2026-11",
    });

    rerender({ initialConfig: config, initialCarriedIn: 480_000, viewedMonth: "2026-12" });
    await flush();

    expect(onLoadCarriedBalance).toHaveBeenCalledOnce();
    expect(onLoadCarriedBalance).toHaveBeenCalledWith("2026-12");
    expect(result.current.carriedIn).toBe(450_000);
    expect(result.current.isLoadingCarried).toBe(false);
  });

  it("reports loading in the very render triggered by a viewedMonth change", async () => {
    const deferred = createDeferred<number | null>();
    onLoadCarriedBalance.mockReturnValueOnce(deferred.promise);
    const renders: { viewedMonth: string; isLoadingCarried: boolean }[] = [];

    const { rerender } = renderHook(
      ({ viewedMonth }: { viewedMonth: string }) => {
        const result = useFinanceV2SavingsFund({
          initialConfig: config,
          initialCarriedIn: 480_000,
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

    expect(renders.find((r) => r.viewedMonth === "2026-12")?.isLoadingCarried).toBe(true);

    await act(async () => {
      deferred.resolve(1);
      await deferred.promise;
    });
  });

  it("ordering guard: an older in-flight response resolving after a newer one does not win", async () => {
    const december = createDeferred<number | null>();
    const january = createDeferred<number | null>();
    onLoadCarriedBalance.mockReturnValueOnce(december.promise);
    onLoadCarriedBalance.mockReturnValueOnce(january.promise);
    const { result, rerender } = renderFund({
      initialConfig: config,
      initialCarriedIn: 480_000,
      viewedMonth: "2026-11",
    });

    rerender({ initialConfig: config, initialCarriedIn: 480_000, viewedMonth: "2026-12" });
    await flush();
    rerender({ initialConfig: config, initialCarriedIn: 480_000, viewedMonth: "2027-01" });
    await flush();

    await act(async () => {
      january.resolve(222);
      await january.promise;
    });
    await act(async () => {
      december.resolve(111);
      await december.promise;
    });

    expect(result.current.carriedIn).toBe(222);
  });

  it("a rejected load exposes null and logs the error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    onLoadCarriedBalance.mockRejectedValueOnce(new Error("transport failure"));
    const { result, rerender } = renderFund({
      initialConfig: config,
      initialCarriedIn: 480_000,
      viewedMonth: "2026-11",
    });

    rerender({ initialConfig: config, initialCarriedIn: 480_000, viewedMonth: "2026-12" });
    await flush();

    expect(result.current.carriedIn).toBeNull();
    expect(result.current.isLoadingCarried).toBe(false);
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("refreshCarried re-fetches the viewed month's carried balance", async () => {
    onLoadCarriedBalance.mockResolvedValueOnce(5000);
    const { result } = renderFund({
      initialConfig: config,
      initialCarriedIn: 480_000,
      viewedMonth: "2026-11",
    });

    act(() => result.current.refreshCarried());
    expect(result.current.isLoadingCarried).toBe(true);
    await flush();

    expect(onLoadCarriedBalance).toHaveBeenCalledWith("2026-11");
    expect(result.current.carriedIn).toBe(5000);
  });

  it("saveConfig on creation stamps the viewed month as openingMonth and persists the config", () => {
    const { result } = renderFund({
      initialConfig: null,
      initialCarriedIn: null,
      viewedMonth: "2026-10",
    });

    act(() => result.current.saveConfig({ name: "Ahorros", openingBalance: 500_000 }));

    expect(result.current.config).toEqual(config);
    expect(onSaveConfig).toHaveBeenCalledOnce();
    expect(onSaveConfig).toHaveBeenCalledWith(config);
  });

  it("saveConfig on edit preserves the existing openingMonth, whatever month is viewed", () => {
    const { result } = renderFund({
      initialConfig: config,
      initialCarriedIn: 480_000,
      viewedMonth: "2027-03",
    });

    act(() => result.current.saveConfig({ name: "Fondo", openingBalance: 0 }));

    const edited = { name: "Fondo", openingBalance: 0, openingMonth: "2026-10" };
    expect(result.current.config).toEqual(edited);
    expect(onSaveConfig).toHaveBeenCalledWith(edited);
  });

  it("saveConfig re-fetches the carried balance only AFTER the save has resolved", async () => {
    const save = createDeferred<void>();
    onSaveConfig.mockReturnValueOnce(save.promise);
    onLoadCarriedBalance.mockResolvedValueOnce(500_000);
    const { result } = renderFund({
      initialConfig: null,
      initialCarriedIn: null,
      viewedMonth: "2026-10",
    });

    act(() => result.current.saveConfig({ name: "Ahorros", openingBalance: 500_000 }));
    await flush();

    expect(onLoadCarriedBalance).not.toHaveBeenCalled();
    expect(result.current.isLoadingCarried).toBe(true);

    await act(async () => {
      save.resolve();
      await save.promise;
    });
    await flush();

    expect(onLoadCarriedBalance).toHaveBeenCalledWith("2026-10");
    expect(result.current.carriedIn).toBe(500_000);
    expect(result.current.isLoadingCarried).toBe(false);
  });
});
