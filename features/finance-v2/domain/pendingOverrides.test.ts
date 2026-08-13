import { describe, it, expect } from "vitest";
import { setPendingOverride } from "./pendingOverrides";
import type { PendingOverrides } from "./pendingOverrides";

describe("setPendingOverride", () => {
  it("creates a new entry for a leaf id with no prior override", () => {
    const overrides: PendingOverrides = {};

    const next = setPendingOverride(overrides, { leafId: "s1", amount: 12000 });

    expect(next).toEqual({ s1: 12000 });
    expect(overrides).toEqual({}); // input untouched
  });

  it("overwrites an existing entry for the same leaf id, replacing not merging", () => {
    const overrides: PendingOverrides = { s1: 30000, s2: 5000 };

    const next = setPendingOverride(overrides, { leafId: "s1", amount: 12000 });

    expect(next).toEqual({ s1: 12000, s2: 5000 });
  });

  it("returns a new object rather than mutating the input", () => {
    const overrides: PendingOverrides = { s1: 30000 };

    const next = setPendingOverride(overrides, { leafId: "s1", amount: 12000 });

    expect(next).not.toBe(overrides);
    expect(overrides).toEqual({ s1: 30000 });
  });
});
