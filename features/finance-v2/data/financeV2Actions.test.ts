import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FinanceV2Config } from "@/features/finance-v2/domain";

const cookiesGetMock = vi.hoisted(() => vi.fn());
const saveDashboardConfigMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: () => ({ get: cookiesGetMock }),
}));
vi.mock("./kvAdapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./kvAdapter")>();
  return {
    ...actual,
    saveDashboardConfig: saveDashboardConfigMock,
  };
});

import { handleSaveDashboardConfig } from "./financeV2Actions";

const config = (overrides: Partial<FinanceV2Config> = {}): FinanceV2Config => ({
  income: 1_000_000,
  fixedPct: 50,
  variablePct: 30,
  savingsPct: 20,
  ...overrides,
});

const withAuth = () => cookiesGetMock.mockReturnValue({ value: "token" });
const withoutAuth = () => cookiesGetMock.mockReturnValue(undefined);

describe("handleSaveDashboardConfig", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing without auth and does not write KV", async () => {
    withoutAuth();
    await handleSaveDashboardConfig(config());
    expect(saveDashboardConfigMock).not.toHaveBeenCalled();
  });

  it("delegates to kvAdapter when authenticated", async () => {
    withAuth();
    const next = config({ income: 2_000_000 });
    await handleSaveDashboardConfig(next);
    expect(saveDashboardConfigMock).toHaveBeenCalledWith(next);
  });
});
