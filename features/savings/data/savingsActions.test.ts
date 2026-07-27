import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SavingsEntry } from "../domain/SavingsEntry";
import type { SavingsPeriod } from "../domain/SavingsPeriod";
import { INITIAL_PERIOD_ID } from "../domain/SavingsPeriod";

const cookiesGetMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const loadEntriesMock = vi.hoisted(() => vi.fn());
const saveEntriesMock = vi.hoisted(() => vi.fn());
const loadPeriodsMock = vi.hoisted(() => vi.fn());
const savePeriodsMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: () => ({ get: cookiesGetMock }),
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("./kvAdapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./kvAdapter")>();
  return {
    ...actual,
    loadEntries: loadEntriesMock,
    saveEntries: saveEntriesMock,
    loadPeriods: loadPeriodsMock,
    savePeriods: savePeriodsMock,
  };
});

import { handleSave, handleArchiveAndStartPeriod } from "./savingsActions";

const withAuth = () => cookiesGetMock.mockReturnValue({ value: "token" });
const withoutAuth = () => cookiesGetMock.mockReturnValue(undefined);

const entry = (overrides: Partial<SavingsEntry> = {}): SavingsEntry => ({
  id: "e1",
  type: "deposito",
  amount: 100,
  date: "2026-06-01",
  toReplenish: false,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

const period = (overrides: Partial<SavingsPeriod> = {}): SavingsPeriod => ({
  id: "p1",
  startedAt: "2026-01-01T00:00:00Z",
  initialAmount: 0,
  ...overrides,
});

describe("handleSave", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when not authenticated", async () => {
    withoutAuth();
    await handleSave([entry()]);
    expect(loadPeriodsMock).not.toHaveBeenCalled();
    expect(saveEntriesMock).not.toHaveBeenCalled();
  });

  it("re-reads archived entries from KV and ignores a client-tampered amount for the same id", async () => {
    withAuth();
    const active = period({ id: "active", startedAt: "2026-02-01T00:00:00Z" });
    const closed = period({ id: "closed", closedAt: "2026-01-31T00:00:00Z" });
    loadPeriodsMock.mockResolvedValue([closed, active]);

    const archivedEntry = entry({ id: "archived-1", periodId: "closed", amount: 100 });
    loadEntriesMock.mockResolvedValue([archivedEntry]);

    const tampered = entry({ id: "archived-1", periodId: "closed", amount: 999999 });
    await handleSave([tampered]);

    const saved = saveEntriesMock.mock.calls[0][0] as SavingsEntry[];
    const persistedArchived = saved.find((e) => e.id === "archived-1");
    expect(persistedArchived?.amount).toBe(100);
  });

  it("leaves the archived entry unchanged when the client omits it entirely", async () => {
    withAuth();
    const active = period({ id: "active" });
    const closed = period({ id: "closed", closedAt: "2026-01-31T00:00:00Z" });
    loadPeriodsMock.mockResolvedValue([closed, active]);

    const archivedEntry = entry({ id: "archived-1", periodId: "closed", amount: 100 });
    loadEntriesMock.mockResolvedValue([archivedEntry]);

    await handleSave([]);

    const saved = saveEntriesMock.mock.calls[0][0] as SavingsEntry[];
    expect(saved).toEqual([archivedEntry]);
  });

  it("re-stamps a client entry targeting a closed period's id to the active period instead", async () => {
    withAuth();
    const active = period({ id: "active" });
    const closed = period({ id: "closed", closedAt: "2026-01-31T00:00:00Z" });
    loadPeriodsMock.mockResolvedValue([closed, active]);
    loadEntriesMock.mockResolvedValue([]);

    const injected = entry({ id: "new-1", periodId: "closed" });
    await handleSave([injected]);

    const saved = saveEntriesMock.mock.calls[0][0] as SavingsEntry[];
    expect(saved).toHaveLength(1);
    expect(saved[0].periodId).toBe("active");
  });

  it("does not let an injected entry join the closed period's own entry set", async () => {
    withAuth();
    const active = period({ id: "active" });
    const closed = period({ id: "closed", closedAt: "2026-01-31T00:00:00Z" });
    loadPeriodsMock.mockResolvedValue([closed, active]);
    const archivedEntry = entry({ id: "archived-1", periodId: "closed" });
    loadEntriesMock.mockResolvedValue([archivedEntry]);

    const injected = entry({ id: "new-1", periodId: "closed" });
    await handleSave([injected]);

    const saved = saveEntriesMock.mock.calls[0][0] as SavingsEntry[];
    const stillClosed = saved.filter((e) => e.periodId === "closed");
    expect(stillClosed).toEqual([archivedEntry]);
  });

  it("stamps periodId onto genuinely new active entries submitted without one", async () => {
    withAuth();
    const active = period({ id: "active" });
    loadPeriodsMock.mockResolvedValue([active]);
    loadEntriesMock.mockResolvedValue([]);

    await handleSave([entry({ id: "new-1" })]);

    const saved = saveEntriesMock.mock.calls[0][0] as SavingsEntry[];
    expect(saved[0].periodId).toBe("active");
  });
});

describe("handleArchiveAndStartPeriod", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when not authenticated", async () => {
    withoutAuth();
    await handleArchiveAndStartPeriod({});
    expect(loadPeriodsMock).not.toHaveBeenCalled();
    expect(savePeriodsMock).not.toHaveBeenCalled();
    expect(saveEntriesMock).not.toHaveBeenCalled();
  });

  it("closes the current active period, preserving its own startedAt/initialAmount (defense in depth with savePeriods merge-guard)", async () => {
    withAuth();
    const active = period({ id: "active", startedAt: "2026-01-01T00:00:00Z", initialAmount: 500 });
    loadPeriodsMock.mockResolvedValue([active]);
    loadEntriesMock.mockResolvedValue([]);

    await handleArchiveAndStartPeriod({});

    const savedPeriods = savePeriodsMock.mock.calls[0][0] as SavingsPeriod[];
    const closed = savedPeriods.find((p) => p.id === "active");
    expect(closed?.closedAt).toBeTruthy();
    expect(closed?.startedAt).toBe("2026-01-01T00:00:00Z");
    expect(closed?.initialAmount).toBe(500);
  });

  it("materializes the bootstrap period and stamps legacy untagged entries on first-ever archive", async () => {
    withAuth();
    loadPeriodsMock.mockResolvedValue([]);
    const legacy = entry({ id: "e1" });
    loadEntriesMock.mockResolvedValue([legacy]);

    await handleArchiveAndStartPeriod({});

    const savedPeriods = savePeriodsMock.mock.calls[0][0] as SavingsPeriod[];
    const closedBootstrap = savedPeriods.find((p) => p.closedAt);
    expect(closedBootstrap?.id).toBe(INITIAL_PERIOD_ID);

    const savedEntries = saveEntriesMock.mock.calls[0][0] as SavingsEntry[];
    expect(savedEntries[0].periodId).toBe(INITIAL_PERIOD_ID);
  });

  it("creates exactly one new active period with no closedAt", async () => {
    withAuth();
    loadPeriodsMock.mockResolvedValue([period({ id: "active" })]);
    loadEntriesMock.mockResolvedValue([]);

    await handleArchiveAndStartPeriod({});

    const savedPeriods = savePeriodsMock.mock.calls[0][0] as SavingsPeriod[];
    const activeOnes = savedPeriods.filter((p) => !p.closedAt);
    expect(activeOnes).toHaveLength(1);
    expect(activeOnes[0].id).not.toBe("active");
  });

  it("uses the given initialAmount for the new active period", async () => {
    withAuth();
    loadPeriodsMock.mockResolvedValue([period({ id: "active" })]);
    loadEntriesMock.mockResolvedValue([]);

    await handleArchiveAndStartPeriod({ initialAmount: 5000 });

    const savedPeriods = savePeriodsMock.mock.calls[0][0] as SavingsPeriod[];
    const newActive = savedPeriods.find((p) => !p.closedAt);
    expect(newActive?.initialAmount).toBe(5000);
  });

  it("defaults initialAmount to 0 when omitted", async () => {
    withAuth();
    loadPeriodsMock.mockResolvedValue([period({ id: "active" })]);
    loadEntriesMock.mockResolvedValue([]);

    await handleArchiveAndStartPeriod({});

    const savedPeriods = savePeriodsMock.mock.calls[0][0] as SavingsPeriod[];
    const newActive = savedPeriods.find((p) => !p.closedAt);
    expect(newActive?.initialAmount).toBe(0);
  });

  it("uses the given label for the new active period, falling back to no label when omitted", async () => {
    withAuth();
    loadPeriodsMock.mockResolvedValue([period({ id: "active" })]);
    loadEntriesMock.mockResolvedValue([]);

    await handleArchiveAndStartPeriod({ label: "Q3 2026" });

    const savedPeriods = savePeriodsMock.mock.calls[0][0] as SavingsPeriod[];
    const newActive = savedPeriods.find((p) => !p.closedAt);
    expect(newActive?.label).toBe("Q3 2026");
  });

  it("conserves entry count across archive (no entry deleted or duplicated)", async () => {
    withAuth();
    loadPeriodsMock.mockResolvedValue([period({ id: "active" })]);
    const existing = [
      entry({ id: "e1", periodId: "active" }),
      entry({ id: "e2", periodId: "active" }),
    ];
    loadEntriesMock.mockResolvedValue(existing);

    await handleArchiveAndStartPeriod({});

    const savedEntries = saveEntriesMock.mock.calls[0][0] as SavingsEntry[];
    expect(savedEntries).toHaveLength(2);
    expect(new Set(savedEntries.map((e) => e.id))).toEqual(new Set(["e1", "e2"]));
  });

  it("leaves toReplenish gasto entries unchanged and tagged to the now-archived period after close", async () => {
    withAuth();
    loadPeriodsMock.mockResolvedValue([period({ id: "active" })]);
    const pendingGasto = entry({
      id: "e1",
      type: "gasto",
      toReplenish: true,
      amount: 250,
      periodId: "active",
    });
    loadEntriesMock.mockResolvedValue([pendingGasto]);

    await handleArchiveAndStartPeriod({});

    const savedEntries = saveEntriesMock.mock.calls[0][0] as SavingsEntry[];
    const persisted = savedEntries.find((e) => e.id === "e1");
    expect(persisted?.toReplenish).toBe(true);
    expect(persisted?.amount).toBe(250);
    expect(persisted?.periodId).toBe("active");
  });

  it("calls revalidatePath('/savings') after archiving", async () => {
    withAuth();
    loadPeriodsMock.mockResolvedValue([period({ id: "active" })]);
    loadEntriesMock.mockResolvedValue([]);

    await handleArchiveAndStartPeriod({});

    expect(revalidatePathMock).toHaveBeenCalledWith("/savings");
  });
});
