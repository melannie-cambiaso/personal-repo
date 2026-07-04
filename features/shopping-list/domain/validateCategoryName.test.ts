import { describe, it, expect } from "vitest";
import { validateCategoryName } from "./validateCategoryName";

describe("validateCategoryName", () => {
  it("rejects an empty string", () => {
    expect(validateCategoryName("")).toBe(false);
  });

  it("rejects a whitespace-only string", () => {
    expect(validateCategoryName("   ")).toBe(false);
  });

  it("accepts a trimmed valid name", () => {
    expect(validateCategoryName("Limpieza")).toBe(true);
  });

  it("accepts a name with surrounding whitespace", () => {
    expect(validateCategoryName("  Supermercado  ")).toBe(true);
  });
});
