import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpendPairing } from "./SpendPairing";

describe("SpendPairing", () => {
  // The symmetric figure to "excedido en": how much is still left to spend,
  // spelled out so the reader does not have to subtract it.
  it("spells out what is left to spend when under budget", () => {
    const { container } = render(<SpendPairing row={{ budgeted: 400_000, spent: 250_000 }} />);

    expect(screen.getByText("$250.000")).toBeTruthy();
    expect(screen.getByText("quedan $150.000")).toBeTruthy();
    // The budgeted amount itself is not shown: the remainder already carries it.
    expect(container.textContent).not.toContain("$400.000");
  });

  it("shows only the spent amount when the spend exactly equals the budget", () => {
    const { container } = render(<SpendPairing row={{ budgeted: 400_000, spent: 400_000 }} />);

    expect(container.textContent).toBe("$400.000");
    expect(container.querySelectorAll("span")).toHaveLength(1);
  });

  it("shows only the spent amount for an empty 0 de 0 row", () => {
    const { container } = render(<SpendPairing row={{ budgeted: 0, spent: 0 }} />);

    expect(container.textContent).toBe("$0");
    expect(container.querySelectorAll("span")).toHaveLength(1);
  });

  it("keeps the excedido suffix, and never a quedan one, when overrun", () => {
    const { container } = render(<SpendPairing row={{ budgeted: 400_000, spent: 450_000 }} />);

    expect(screen.getByText("excedido en $50.000")).toBeTruthy();
    expect(screen.queryByText(/quedan/)).toBeNull();
    expect(container.textContent).not.toContain("$400.000");
  });
});
