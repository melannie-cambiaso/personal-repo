import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SavingsFundCard } from "./SavingsFundCard";
import type { SavingsFundView } from "./savingsFundView";

const view: SavingsFundView = {
  config: { name: "Ahorros", openingBalance: 500_000, openingMonth: "2026-10" },
  carriedIn: 480_000,
  flows: { deposited: 50_000, withdrawn: 20_000, spent: 7_000 },
};

describe("SavingsFundCard", () => {
  it("shows the fund name and its figures: carried-in, deposited, withdrawn, spent, end balance", () => {
    render(<SavingsFundCard view={view} onEdit={vi.fn()} />);

    expect(screen.getByText("Ahorros")).toBeTruthy();
    expect(screen.getByText("Saldo inicial del mes").nextSibling?.textContent).toBe("$480.000");
    expect(screen.getByText("Depositado").nextSibling?.textContent).toBe("$50.000");
    expect(screen.getByText("Retirado a la cuenta").nextSibling?.textContent).toBe("$20.000");
    expect(screen.getByText("Gastado").nextSibling?.textContent).toBe("$7.000");
    expect(screen.getByText("Saldo").nextSibling?.textContent).toBe("$503.000");
  });

  it("renders a negative end balance in red with a warning, never blocking anything", () => {
    render(
      <SavingsFundCard
        view={{ ...view, carriedIn: 0, flows: { deposited: 0, withdrawn: 0, spent: 43_000 } }}
        onEdit={vi.fn()}
      />
    );

    const balance = screen.getByText("Saldo").nextSibling as HTMLElement;
    expect(balance.textContent).toBe("-$43.000");
    expect(balance.className).toContain("text-red-700");
    expect(screen.getByRole("alert").textContent).toMatch(/negativo/i);
  });

  it("shows no warning for a non-negative balance", () => {
    render(<SavingsFundCard view={view} onEdit={vi.fn()} />);

    expect(screen.queryByRole("alert")).toBeNull();
    expect((screen.getByText("Saldo").nextSibling as HTMLElement).className).not.toContain(
      "text-red-700"
    );
  });

  it("renders nothing while the carried-in balance is unavailable (loading or month before the fund)", () => {
    const { container } = render(
      <SavingsFundCard view={{ ...view, carriedIn: null }} onEdit={vi.fn()} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("the edit button calls onEdit", () => {
    const onEdit = vi.fn();
    render(<SavingsFundCard view={view} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar ahorros" }));

    expect(onEdit).toHaveBeenCalledOnce();
  });
});
