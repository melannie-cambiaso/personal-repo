import { describe, expect, it } from "vitest";
import { PRIORITY_LABELS, resolvePriority } from "./Priority";

describe("resolvePriority", () => {
  it("returns the stored priority", () => {
    expect(resolvePriority({ priority: "high" })).toBe("high");
    expect(resolvePriority({ priority: "low" })).toBe("low");
  });

  it("treats legacy items without a priority as medium", () => {
    expect(resolvePriority({})).toBe("medium");
  });
});

describe("PRIORITY_LABELS", () => {
  it("labels every priority", () => {
    expect(PRIORITY_LABELS).toEqual({ high: "Alta", medium: "Media", low: "Baja" });
  });
});
