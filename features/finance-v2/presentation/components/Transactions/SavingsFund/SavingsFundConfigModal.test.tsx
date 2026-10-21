import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SavingsFundConfigModal } from "./SavingsFundConfigModal";
import type { SavingsFundConfig } from "@/features/finance-v2/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const existing: SavingsFundConfig = {
  name: "Ahorros",
  openingBalance: 500_000,
  openingMonth: "2026-10",
};

const renderModal = (config: SavingsFundConfig | null = null) => {
  const onClose = vi.fn();
  const onSave = vi.fn();
  render(<SavingsFundConfigModal isOpen config={config} onClose={onClose} onSave={onSave} />);
  return { onClose, onSave };
};

describe("SavingsFundConfigModal", () => {
  it("saves name and opening balance — and NOTHING about the opening month, which the hook owns", () => {
    const { onSave } = renderModal();

    fireEvent.change(screen.getByLabelText("Nombre del fondo"), { target: { value: "Ahorros" } });
    fireEvent.change(screen.getByLabelText("Saldo inicial"), { target: { value: "500000" } });
    fireEvent.click(screen.getByText("Guardar ahorros"));

    expect(onSave).toHaveBeenCalledWith({ name: "Ahorros", openingBalance: 500_000 });
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("openingMonth");
  });

  it("offers no category picker: the fund is not bound to any budget category", () => {
    renderModal();

    expect(screen.queryByLabelText("Categoría vinculada")).toBeNull();
  });

  it("closes after a successful save", () => {
    const { onClose } = renderModal();

    fireEvent.change(screen.getByLabelText("Nombre del fondo"), { target: { value: "Ahorros" } });
    fireEvent.click(screen.getByText("Guardar ahorros"));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not save a fund without a name", () => {
    const { onSave, onClose } = renderModal();

    fireEvent.change(screen.getByLabelText("Nombre del fondo"), { target: { value: "   " } });
    fireEvent.click(screen.getByText("Guardar ahorros"));

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("treats an empty opening balance as zero", () => {
    const { onSave } = renderModal();

    fireEvent.change(screen.getByLabelText("Nombre del fondo"), { target: { value: "Ahorros" } });
    fireEvent.click(screen.getByText("Guardar ahorros"));

    expect(onSave).toHaveBeenCalledWith({ name: "Ahorros", openingBalance: 0 });
  });

  it("seeds the form from the existing config when editing", () => {
    renderModal(existing);

    expect((screen.getByLabelText("Nombre del fondo") as HTMLInputElement).value).toBe("Ahorros");
    expect((screen.getByLabelText("Saldo inicial") as HTMLInputElement).value).toBe("500000");
  });

  it("the close control calls onClose", () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByLabelText("Cerrar"));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
