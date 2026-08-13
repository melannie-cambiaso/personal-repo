import { describe, it, expect } from "vitest";
import type { PendingView } from "@/features/finance-v2/domain";
import { toPendingTabView } from "./pendingTabView";

const viewFixture: PendingView = {
  rows: [{ id: "c1", name: "Arriendo", bucket: "fixed", computed: 30000, amount: 30000, isOverridden: false }],
  total: 30000,
};

describe("toPendingTabView", () => {
  it("reports loading and discards the view while spend is still in flight, even if overrides finished loading", () => {
    expect(toPendingTabView(true, false, viewFixture)).toEqual({ status: "loading" });
  });

  it("reports loading and discards the view while overrides are still in flight, even if spend finished loading", () => {
    expect(toPendingTabView(false, true, viewFixture)).toEqual({ status: "loading" });
  });

  it("reports loading while BOTH sources are still in flight", () => {
    expect(toPendingTabView(true, true, viewFixture)).toEqual({ status: "loading" });
  });

  it("reports ready with the given view only once BOTH sources have finished loading", () => {
    expect(toPendingTabView(false, false, viewFixture)).toEqual({ status: "ready", view: viewFixture });
  });
});
