import { describe, it, expect } from "vitest";
import { FEATURE_NAV_ITEMS } from "./features";

describe("FEATURE_NAV_ITEMS", () => {
  it("has exactly 6 entries", () => {
    expect(FEATURE_NAV_ITEMS).toHaveLength(6);
  });

  it("does not include a login entry", () => {
    const hrefs = FEATURE_NAV_ITEMS.map((item) => item.href);
    expect(hrefs).not.toContain("/login");
  });

  it("gives every entry an href, label, and icon", () => {
    for (const item of FEATURE_NAV_ITEMS) {
      expect(item.href).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
    }
  });

  it("links every content feature to its route", () => {
    const hrefs = FEATURE_NAV_ITEMS.map((item) => item.href).sort();
    expect(hrefs).toEqual(
      [
        "/finance",
        "/home-improvements",
        "/savings",
        "/shopping-list",
        "/todo",
        "/wishlist",
      ].sort()
    );
  });
});
