import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { groupByPerson, isToday } from "./utils";
import type { ActivityLogEntry } from "./ActivityLogEntry";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const entry = (
  overrides: Partial<ActivityLogEntry> & { person: ActivityLogEntry["person"] },
): ActivityLogEntry => ({
  id: "1",
  date: "2026-06-20",
  activity: "some activity",
  createdAt: "2026-06-20T10:00:00Z",
  ...overrides,
});

// ---------------------------------------------------------------------------
// groupByPerson
// ---------------------------------------------------------------------------

describe("groupByPerson", () => {
  it("returns empty record for empty array", () => {
    expect(groupByPerson([])).toEqual({});
  });

  it("groups entries for a single person", () => {
    const entries = [
      entry({ id: "1", person: "Meme" }),
      entry({ id: "2", person: "Meme" }),
    ];
    const result = groupByPerson(entries);
    expect(Object.keys(result)).toEqual(["Meme"]);
    expect(result["Meme"]).toHaveLength(2);
    expect("Pedro" in result).toBe(false);
  });

  it("groups entries for both persons", () => {
    const entries = [
      entry({ id: "1", person: "Meme" }),
      entry({ id: "2", person: "Pedro" }),
      entry({ id: "3", person: "Meme" }),
    ];
    const result = groupByPerson(entries);
    expect(Object.keys(result).sort()).toEqual(["Meme", "Pedro"]);
    expect(result["Meme"]).toHaveLength(2);
    expect(result["Pedro"]).toHaveLength(1);
  });

  it("preserves referential equality of original entry objects", () => {
    const e1 = entry({ id: "1", person: "Meme" });
    const e2 = entry({ id: "2", person: "Pedro" });
    const result = groupByPerson([e1, e2]);
    expect(result["Meme"]![0]).toBe(e1);
    expect(result["Pedro"]![0]).toBe(e2);
  });
});

// ---------------------------------------------------------------------------
// isToday
// ---------------------------------------------------------------------------

describe("isToday", () => {
  beforeEach(() => {
    // Pin clock to 2026-06-25T12:00:00Z
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for today's date string", () => {
    expect(isToday("2026-06-25")).toBe(true);
  });

  it("returns false for yesterday's date string", () => {
    expect(isToday("2026-06-24")).toBe(false);
  });

  it("returns false for a future date string", () => {
    expect(isToday("2026-06-26")).toBe(false);
  });
});
