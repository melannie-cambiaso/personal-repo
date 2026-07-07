import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddItemModal } from "./AddItemModal";
import type { Zone } from "@/features/home-improvements/domain/Zone";

const zones: Zone[] = [
  { id: "z1", name: "Living" },
  { id: "z2", name: "Cocina" },
];

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("AddItemModal", () => {
  it("renders every form field, including zone/quantity and cost", () => {
    render(<AddItemModal isOpen zones={zones} onClose={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByLabelText("Título *")).toBeTruthy();
    expect(screen.getByLabelText("Tipo *")).toBeTruthy();
    expect(screen.getByLabelText("Zona *")).toBeTruthy();
    expect(screen.getByLabelText("Cantidad")).toBeTruthy();
    expect(screen.getByLabelText("Costo estimado por unidad ($)")).toBeTruthy();
    expect(screen.getByLabelText("Dónde comprarlo (URL)")).toBeTruthy();
    expect(screen.getByLabelText("Descripción")).toBeTruthy();
    expect(screen.getByLabelText("Notas")).toBeTruthy();
  });

  it("lets the user pick a zone and type quantity", () => {
    render(<AddItemModal isOpen zones={zones} onClose={vi.fn()} onAdd={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Zona *"), { target: { value: "z2" } });
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "3" } });
    expect((screen.getByLabelText("Zona *") as HTMLSelectElement).value).toBe("z2");
    expect((screen.getByLabelText("Cantidad") as HTMLInputElement).value).toBe("3");
  });

  it("submits the fully-filled form and calls onAdd with every value", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddItemModal isOpen zones={zones} onClose={onClose} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Pintar" } });
    fireEvent.change(screen.getByLabelText("Zona *"), { target: { value: "z2" } });
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Costo estimado por unidad ($)"), {
      target: { value: "12000" },
    });
    fireEvent.click(screen.getByText("Agregar ✓"));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const added = onAdd.mock.calls[0][0];
    expect(added.title).toBe("Pintar");
    expect(added.zoneId).toBe("z2");
    expect(added.quantity).toBe(3);
    expect(added.estimatedCost).toBe(12000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
