import { describe, it, expect } from "vitest";
import { createMemoryKv, isMemoryKvEnabled, parseSeed } from "./kvMemory";

describe("createMemoryKv", () => {
  it("returns null for a missing key", async () => {
    const kv = createMemoryKv();
    expect(await kv.get("nope")).toBeNull();
  });

  it("returns what was set", async () => {
    const kv = createMemoryKv();
    await kv.set("k", { a: [1, 2] });
    expect(await kv.get("k")).toEqual({ a: [1, 2] });
  });

  it("stores copies, so callers cannot mutate stored data by reference", async () => {
    const kv = createMemoryKv();
    const value = { list: [1] };
    await kv.set("k", value);
    value.list.push(2);
    const read = await kv.get<{ list: number[] }>("k");
    read!.list.push(3);
    expect(await kv.get("k")).toEqual({ list: [1] });
  });

  it("mget returns values in key order, with null for missing keys", async () => {
    const kv = createMemoryKv({ a: 1, c: 3 });
    expect(await kv.mget("a", "b", "c")).toEqual([1, null, 3]);
  });

  it("starts from the seed", async () => {
    const kv = createMemoryKv({ "savings-entries": [{ id: "e1" }] });
    expect(await kv.get("savings-entries")).toEqual([{ id: "e1" }]);
  });
});

describe("parseSeed", () => {
  it("replaces every {{MONTH}} placeholder in keys and values", () => {
    const seed = parseSeed(
      '{"finance-v2-transactions:{{MONTH}}": [{"date": "{{MONTH}}-05"}]}',
      "2026-10"
    );
    expect(seed).toEqual({ "finance-v2-transactions:2026-10": [{ date: "2026-10-05" }] });
  });
});

describe("isMemoryKvEnabled", () => {
  it("is off when E2E is unset", () => {
    expect(isMemoryKvEnabled({})).toBe(false);
  });

  it("is off for any value other than 1", () => {
    expect(isMemoryKvEnabled({ E2E: "true" })).toBe(false);
  });

  it("is on when E2E=1 outside Vercel", () => {
    expect(isMemoryKvEnabled({ E2E: "1" })).toBe(true);
  });

  it("refuses to turn on inside a Vercel deployment", () => {
    expect(() => isMemoryKvEnabled({ E2E: "1", VERCEL: "1" })).toThrow(
      "E2E=1 is not allowed on Vercel"
    );
  });
});
