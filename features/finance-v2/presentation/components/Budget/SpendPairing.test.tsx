import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpendPairing } from "./SpendPairing";

describe("SpendPairing", () => {
  // The symmetric figure to "excedido en": how much is still left to spend,
  // spelled out so the reader does not have to subtract it.
  it("spells out what is left to spend when under budget", () => {
    render(<SpendPairing row={{ budgeted: 400_000, spent: 250_000 }} />);

    expect(screen.getByText("$250.000")).toBeTruthy();
    expect(screen.getByText("de $400.000 · quedan $150.000")).toBeTruthy();
  });

  it("shows no suffix when the spend exactly equals the budget", () => {
    render(<SpendPairing row={{ budgeted: 400_000, spent: 400_000 }} />);

    expect(screen.getByText("de $400.000")).toBeTruthy();
    expect(screen.queryByText(/quedan|excedido/)).toBeNull();
  });

  it("shows no suffix for an empty 0 de 0 row", () => {
    render(<SpendPairing row={{ budgeted: 0, spent: 0 }} />);

    expect(screen.getByText("de $0")).toBeTruthy();
    expect(screen.queryByText(/quedan|excedido/)).toBeNull();
  });

  it("keeps the excedido suffix, and never a quedan one, when overrun", () => {
    render(<SpendPairing row={{ budgeted: 400_000, spent: 450_000 }} />);

    expect(screen.getByText("de $400.000 · excedido en $50.000")).toBeTruthy();
    expect(screen.queryByText(/quedan/)).toBeNull();
  });
});
