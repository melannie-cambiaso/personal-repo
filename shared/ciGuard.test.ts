import { describe, it, expect } from "vitest";

// Deliberately failing test: proves the CI check blocks merging into main.
// This branch's PR is closed without merging.
describe("CI guard", () => {
  it("fails on purpose", () => {
    expect(1).toBe(2);
  });
});
