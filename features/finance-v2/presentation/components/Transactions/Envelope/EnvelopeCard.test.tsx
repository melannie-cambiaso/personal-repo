import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EnvelopeCard } from "./EnvelopeCard";
import type { EnvelopeView } from "./envelopeView";

const view: EnvelopeView = {
  config: { name: "Servicios", boundCategoryId: "cuentas", openingBalance: 0, openingMonth: "2026-10" },
  carriedIn: 7_000,
  flows: { transferred: 116_000, paid: 43_000 },
  suggestedTransfer: 116_000,
};

describe("EnvelopeCard", () => {
  it("shows the envelope name and its four figures: carried-in, transferred, paid, end balance", () => {
    render(<EnvelopeCard view={view} onEdit={vi.fn()} />);

    expect(screen.getByText("Servicios")).toBeTruthy();
    expect(screen.getByText("Saldo inicial del mes").nextSibling?.textContent).toBe("$7.000");
    expect(screen.getByText("Transferido").nextSibling?.textContent).toBe("$116.000");
    expect(screen.getByText("Pagado").nextSibling?.textContent).toBe("$43.000");
    expect(screen.getByText("Saldo").nextSibling?.textContent).toBe("$80.000");
  });

  it("renders a negative end balance in red with a warning, never blocking anything", () => {
    render(
      <EnvelopeCard
        view={{ ...view, carriedIn: 0, flows: { transferred: 0, paid: 43_000 } }}
        onEdit={vi.fn()}
      />
    );

    const balance = screen.getByText("Saldo").nextSibling as HTMLElement;
    expect(balance.textContent).toBe("-$43.000");
    expect(balance.className).toContain("text-red-700");
    expect(screen.getByRole("alert").textContent).toMatch(/negativo/i);
  });

  it("shows no warning for a non-negative balance", () => {
    render(<EnvelopeCard view={view} onEdit={vi.fn()} />);

    expect(screen.queryByRole("alert")).toBeNull();
    expect((screen.getByText("Saldo").nextSibling as HTMLElement).className).not.toContain(
      "text-red-700"
    );
  });

  it("renders nothing while the carried-in balance is unavailable (loading or month before the envelope)", () => {
    const { container } = render(<EnvelopeCard view={{ ...view, carriedIn: null }} onEdit={vi.fn()} />);

    expect(container.innerHTML).toBe("");
  });

  it("the edit button calls onEdit", () => {
    const onEdit = vi.fn();
    render(<EnvelopeCard view={view} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar cuenta" }));

    expect(onEdit).toHaveBeenCalledOnce();
  });
});
