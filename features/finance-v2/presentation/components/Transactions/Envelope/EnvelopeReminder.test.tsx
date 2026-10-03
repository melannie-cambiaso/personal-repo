import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EnvelopeReminder } from "./EnvelopeReminder";
import type { EnvelopeView } from "./envelopeView";

const view: EnvelopeView = {
  config: {
    name: "Servicios",
    boundCategoryId: "cuentas",
    openingBalance: 0,
    openingMonth: "2026-10",
  },
  carriedIn: 7_000,
  flows: { transferred: 0, paid: 0 },
  suggestedTransfer: 116_000,
};

describe("EnvelopeReminder", () => {
  it("reminds the user to transfer, naming the envelope and the suggested amount, when the month has no transfer", () => {
    render(<EnvelopeReminder view={view} />);

    const reminder = screen.getByRole("status");
    expect(reminder.textContent).toContain("Todavía no transferiste a Servicios este mes");
    expect(reminder.textContent).toContain("Sugerido: $116.000");
  });

  it("disappears as soon as the month has a transfer", () => {
    const { container } = render(
      <EnvelopeReminder view={{ ...view, flows: { transferred: 116_000, paid: 0 } }} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders nothing while the carried-in balance is unavailable (loading or month before the envelope)", () => {
    const { container } = render(<EnvelopeReminder view={{ ...view, carriedIn: null }} />);

    expect(container.innerHTML).toBe("");
  });

  it("asks the user to reconfigure instead of suggesting an amount when the bound category is gone", () => {
    render(<EnvelopeReminder view={{ ...view, suggestedTransfer: null }} />);

    const reminder = screen.getByRole("status");
    expect(reminder.textContent).toContain("La categoría vinculada ya no existe");
    expect(reminder.textContent).toContain("Revisá la configuración");
    expect(reminder.textContent).not.toContain("Sugerido");
  });
});
