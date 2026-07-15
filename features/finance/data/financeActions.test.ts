import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FinanceTransaction, BudgetUnitConfig } from "@/features/finance/domain";

const cookiesGetMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const loadTransactionsMock = vi.hoisted(() => vi.fn());
const saveTransactionsMock = vi.hoisted(() => vi.fn());
const loadClosedCategoriesMock = vi.hoisted(() => vi.fn());
const saveClosedCategoriesMock = vi.hoisted(() => vi.fn());
const loadBudgetUnitConfigMock = vi.hoisted(() => vi.fn());
const saveBudgetUnitConfigMock = vi.hoisted(() => vi.fn());
const loadExcludedCategoriesMock = vi.hoisted(() => vi.fn());
const saveExcludedCategoriesMock = vi.hoisted(() => vi.fn());
const loadCategoryNotesMock = vi.hoisted(() => vi.fn());
const saveCategoryNotesMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: () => ({ get: cookiesGetMock }),
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("./kvAdapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./kvAdapter")>();
  return {
    ...actual,
    loadTransactions: loadTransactionsMock,
    saveTransactions: saveTransactionsMock,
    loadClosedCategories: loadClosedCategoriesMock,
    saveClosedCategories: saveClosedCategoriesMock,
    loadBudgetUnitConfig: loadBudgetUnitConfigMock,
    saveBudgetUnitConfig: saveBudgetUnitConfigMock,
    loadExcludedCategories: loadExcludedCategoriesMock,
    saveExcludedCategories: saveExcludedCategoriesMock,
    loadCategoryNotes: loadCategoryNotesMock,
    saveCategoryNotes: saveCategoryNotesMock,
  };
});

import {
  getTransactionsForMonth,
  addTransaction,
  deleteTransaction,
  getClosedCategoriesForMonth,
  toggleClosedCategory,
  getBudgetUnitConfigForMonth,
  handleSaveBudgetUnitConfig,
  getExcludedCategoriesForMonth,
  toggleExcludedCategory,
  setExcludedCategoriesForMonth,
  getCategoryNotes,
  saveCategoryNote,
} from "./financeActions";

const tx = (overrides: Partial<FinanceTransaction> = {}): FinanceTransaction => ({
  id: "abc-1",
  category: "Comida",
  amount: 500,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

const withAuth = () => cookiesGetMock.mockReturnValue({ value: "token" });
const withoutAuth = () => cookiesGetMock.mockReturnValue(undefined);

describe("getTransactionsForMonth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when not authenticated", async () => {
    withoutAuth();
    const result = await getTransactionsForMonth("2026-06");
    expect(result).toEqual([]);
    expect(loadTransactionsMock).not.toHaveBeenCalled();
  });

  it("returns transactions from kvAdapter when authenticated", async () => {
    withAuth();
    const stored = [tx()];
    loadTransactionsMock.mockResolvedValue(stored);
    const result = await getTransactionsForMonth("2026-06");
    expect(result).toEqual(stored);
    expect(loadTransactionsMock).toHaveBeenCalledWith("2026-06");
  });
});

describe("addTransaction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when not authenticated", async () => {
    withoutAuth();
    await addTransaction("2026-06", "Comida", 500);
    expect(loadTransactionsMock).not.toHaveBeenCalled();
    expect(saveTransactionsMock).not.toHaveBeenCalled();
  });

  it("appends a new transaction and saves when authenticated", async () => {
    withAuth();
    const existing = [tx()];
    loadTransactionsMock.mockResolvedValue(existing);
    saveTransactionsMock.mockResolvedValue(undefined);

    await addTransaction("2026-06", "Planes", 300);

    const savedTxs: FinanceTransaction[] = saveTransactionsMock.mock.calls[0][1];
    expect(savedTxs).toHaveLength(2);
    const newTx = savedTxs[1];
    expect(newTx.category).toBe("Planes");
    expect(newTx.amount).toBe(300);
    expect(typeof newTx.id).toBe("string");
    expect(typeof newTx.createdAt).toBe("string");
  });

  it("calls revalidatePath('/finance') after saving", async () => {
    withAuth();
    loadTransactionsMock.mockResolvedValue([]);
    saveTransactionsMock.mockResolvedValue(undefined);
    await addTransaction("2026-06", "Comida", 100);
    expect(revalidatePathMock).toHaveBeenCalledWith("/finance");
  });
});

describe("deleteTransaction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when not authenticated", async () => {
    withoutAuth();
    await deleteTransaction("2026-06", "abc-1");
    expect(loadTransactionsMock).not.toHaveBeenCalled();
    expect(saveTransactionsMock).not.toHaveBeenCalled();
  });

  it("removes the matching transaction by id and saves", async () => {
    withAuth();
    const existing = [tx({ id: "abc-1" }), tx({ id: "abc-2", amount: 200 })];
    loadTransactionsMock.mockResolvedValue(existing);
    saveTransactionsMock.mockResolvedValue(undefined);

    await deleteTransaction("2026-06", "abc-1");

    const savedTxs: FinanceTransaction[] = saveTransactionsMock.mock.calls[0][1];
    expect(savedTxs).toHaveLength(1);
    expect(savedTxs[0].id).toBe("abc-2");
  });

  it("calls revalidatePath('/finance') after deleting", async () => {
    withAuth();
    loadTransactionsMock.mockResolvedValue([tx()]);
    saveTransactionsMock.mockResolvedValue(undefined);
    await deleteTransaction("2026-06", "abc-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/finance");
  });
});

describe("getClosedCategoriesForMonth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns [] without auth and does not read Redis", async () => {
    withoutAuth();
    const result = await getClosedCategoriesForMonth("2026-06");
    expect(result).toEqual([]);
    expect(loadClosedCategoriesMock).not.toHaveBeenCalled();
  });

  it("returns the stored array from kvAdapter when authenticated", async () => {
    withAuth();
    loadClosedCategoriesMock.mockResolvedValue(["Alquiler"]);
    const result = await getClosedCategoriesForMonth("2026-06");
    expect(result).toEqual(["Alquiler"]);
    expect(loadClosedCategoriesMock).toHaveBeenCalledWith("2026-06");
  });
});

describe("toggleClosedCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing without auth", async () => {
    withoutAuth();
    await toggleClosedCategory("2026-06", "Alquiler");
    expect(loadClosedCategoriesMock).not.toHaveBeenCalled();
    expect(saveClosedCategoriesMock).not.toHaveBeenCalled();
  });

  it("adds the category when it is not currently closed", async () => {
    withAuth();
    loadClosedCategoriesMock.mockResolvedValue(["Internet"]);
    await toggleClosedCategory("2026-06", "Alquiler");
    expect(saveClosedCategoriesMock).toHaveBeenCalledWith("2026-06", ["Internet", "Alquiler"]);
  });

  it("removes the category when it is already closed", async () => {
    withAuth();
    loadClosedCategoriesMock.mockResolvedValue(["Alquiler", "Internet"]);
    await toggleClosedCategory("2026-06", "Alquiler");
    expect(saveClosedCategoriesMock).toHaveBeenCalledWith("2026-06", ["Internet"]);
  });

  it("does NOT call revalidatePath", async () => {
    withAuth();
    loadClosedCategoriesMock.mockResolvedValue([]);
    await toggleClosedCategory("2026-06", "Alquiler");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("getExcludedCategoriesForMonth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns [] without auth and does not read Redis", async () => {
    withoutAuth();
    const result = await getExcludedCategoriesForMonth("2026-06");
    expect(result).toEqual([]);
    expect(loadExcludedCategoriesMock).not.toHaveBeenCalled();
  });

  it("returns the stored array from kvAdapter when authenticated", async () => {
    withAuth();
    loadExcludedCategoriesMock.mockResolvedValue(["Suscripciones"]);
    const result = await getExcludedCategoriesForMonth("2026-06");
    expect(result).toEqual(["Suscripciones"]);
    expect(loadExcludedCategoriesMock).toHaveBeenCalledWith("2026-06");
  });
});

describe("toggleExcludedCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing without auth", async () => {
    withoutAuth();
    await toggleExcludedCategory("2026-06", "Suscripciones");
    expect(loadExcludedCategoriesMock).not.toHaveBeenCalled();
    expect(saveExcludedCategoriesMock).not.toHaveBeenCalled();
  });

  it("adds the category when it is not currently excluded", async () => {
    withAuth();
    loadExcludedCategoriesMock.mockResolvedValue(["Internet"]);
    await toggleExcludedCategory("2026-06", "Suscripciones");
    expect(saveExcludedCategoriesMock).toHaveBeenCalledWith("2026-06", [
      "Internet",
      "Suscripciones",
    ]);
  });

  it("removes the category when it is already excluded", async () => {
    withAuth();
    loadExcludedCategoriesMock.mockResolvedValue(["Suscripciones", "Internet"]);
    await toggleExcludedCategory("2026-06", "Suscripciones");
    expect(saveExcludedCategoriesMock).toHaveBeenCalledWith("2026-06", ["Internet"]);
  });
});

describe("setExcludedCategoriesForMonth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing without auth", async () => {
    withoutAuth();
    await setExcludedCategoriesForMonth("2026-06", ["Suscripciones"]);
    expect(saveExcludedCategoriesMock).not.toHaveBeenCalled();
  });

  it("replaces the full excluded-categories list when authenticated (no read-modify-write)", async () => {
    withAuth();
    await setExcludedCategoriesForMonth("2026-06", ["Suscripciones", "Gimnasio"]);
    expect(saveExcludedCategoriesMock).toHaveBeenCalledWith("2026-06", [
      "Suscripciones",
      "Gimnasio",
    ]);
    expect(loadExcludedCategoriesMock).not.toHaveBeenCalled();
  });

  it("replaces with an empty list when the reference month has no exclusions", async () => {
    withAuth();
    await setExcludedCategoriesForMonth("2026-06", []);
    expect(saveExcludedCategoriesMock).toHaveBeenCalledWith("2026-06", []);
  });
});

describe("getCategoryNotes (global — not month-scoped)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns {} without auth and does not read Redis", async () => {
    withoutAuth();
    const result = await getCategoryNotes();
    expect(result).toEqual({});
    expect(loadCategoryNotesMock).not.toHaveBeenCalled();
  });

  it("returns the stored map from kvAdapter when authenticated, with no month argument", async () => {
    withAuth();
    loadCategoryNotesMock.mockResolvedValue({ Suscripciones: "Netflix + Spotify" });
    const result = await getCategoryNotes();
    expect(result).toEqual({ Suscripciones: "Netflix + Spotify" });
    expect(loadCategoryNotesMock).toHaveBeenCalledWith();
  });
});

describe("saveCategoryNote (global — not month-scoped)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing without auth", async () => {
    withoutAuth();
    await saveCategoryNote("Suscripciones", "Netflix");
    expect(loadCategoryNotesMock).not.toHaveBeenCalled();
    expect(saveCategoryNotesMock).not.toHaveBeenCalled();
  });

  it("sets the category's note when text is non-empty", async () => {
    withAuth();
    loadCategoryNotesMock.mockResolvedValue({});
    await saveCategoryNote("Suscripciones", "Netflix + Spotify");
    expect(saveCategoryNotesMock).toHaveBeenCalledWith({
      Suscripciones: "Netflix + Spotify",
    });
  });

  it("preserves other categories' notes when saving one category's note (read-modify-write)", async () => {
    withAuth();
    loadCategoryNotesMock.mockResolvedValue({ Internet: "Fibra 500mb" });
    await saveCategoryNote("Suscripciones", "Netflix");
    expect(saveCategoryNotesMock).toHaveBeenCalledWith({
      Internet: "Fibra 500mb",
      Suscripciones: "Netflix",
    });
  });

  it("deletes the category's key when text is empty", async () => {
    withAuth();
    loadCategoryNotesMock.mockResolvedValue({ Suscripciones: "Netflix" });
    await saveCategoryNote("Suscripciones", "");
    expect(saveCategoryNotesMock).toHaveBeenCalledWith({});
  });

  it("deletes the category's key when text is whitespace-only", async () => {
    withAuth();
    loadCategoryNotesMock.mockResolvedValue({ Suscripciones: "Netflix" });
    await saveCategoryNote("Suscripciones", "   ");
    expect(saveCategoryNotesMock).toHaveBeenCalledWith({});
  });

  it("the same note applies regardless of which month is active (global scope, no per-month drift)", async () => {
    withAuth();
    loadCategoryNotesMock.mockResolvedValue({});
    await saveCategoryNote("Suscripciones", "Netflix");
    // saveCategoryNote takes no month argument at all — the note is not scoped to a month
    expect(saveCategoryNotesMock).toHaveBeenCalledWith({ Suscripciones: "Netflix" });
    expect(saveCategoryNotesMock.mock.calls[0]).toHaveLength(1);
  });
});

describe("getBudgetUnitConfigForMonth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns {} without auth and does not read Redis", async () => {
    withoutAuth();
    const result = await getBudgetUnitConfigForMonth("2026-06");
    expect(result).toEqual({});
    expect(loadBudgetUnitConfigMock).not.toHaveBeenCalled();
  });

  it("returns the stored config from kvAdapter when authenticated", async () => {
    withAuth();
    const stored: BudgetUnitConfig = { DBT: { unitAmount: 55000, quantity: 5, factor: 0.9 } };
    loadBudgetUnitConfigMock.mockResolvedValue(stored);
    const result = await getBudgetUnitConfigForMonth("2026-06");
    expect(result).toEqual(stored);
    expect(loadBudgetUnitConfigMock).toHaveBeenCalledWith("2026-06");
  });
});

describe("handleSaveBudgetUnitConfig", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing without auth", async () => {
    withoutAuth();
    await handleSaveBudgetUnitConfig("2026-06", { DBT: { unitAmount: 1, quantity: 1, factor: 1 } });
    expect(saveBudgetUnitConfigMock).not.toHaveBeenCalled();
  });

  it("saves the config via kvAdapter when authenticated", async () => {
    withAuth();
    const config: BudgetUnitConfig = { DBT: { unitAmount: 55000, quantity: 5, factor: 0.9 } };
    await handleSaveBudgetUnitConfig("2026-06", config);
    expect(saveBudgetUnitConfigMock).toHaveBeenCalledWith("2026-06", config);
  });
});
