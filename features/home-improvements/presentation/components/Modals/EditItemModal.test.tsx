import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditItemModal } from "./EditItemModal";
import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import type { Zone } from "@/features/home-improvements/domain/Zone";

const zones: Zone[] = [{ id: "z1", name: "Living" }];

const item: ImprovementItem = {
  id: "1",
  zoneId: "z1",
  title: "Pintar paredes",
  type: "Pintura" as ImprovementItem["type"],
  estimatedCost: 15000,
  quantity: 2,
  done: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("EditItemModal", () => {
  it("renders every form field, including the quantity/cost pair", () => {
    render(<EditItemModal item={item} zones={zones} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByLabelText("Título *")).toBeTruthy();
    expect(screen.getByLabelText("Tipo *")).toBeTruthy();
    expect(screen.getByLabelText("Cantidad")).toBeTruthy();
    expect(screen.getByLabelText("Costo estimado por unidad ($)")).toBeTruthy();
    expect(screen.getByLabelText("Dónde comprarlo (URL)")).toBeTruthy();
    expect(screen.getByLabelText("Descripción")).toBeTruthy();
    expect(screen.getByLabelText("Notas")).toBeTruthy();
  });

  it("lets the user edit quantity and cost", () => {
    render(<EditItemModal item={item} zones={zones} onClose={vi.fn()} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Costo estimado por unidad ($)"), {
      target: { value: "20000" },
    });
    expect((screen.getByLabelText("Cantidad") as HTMLInputElement).value).toBe("5");
    expect((screen.getByLabelText("Costo estimado por unidad ($)") as HTMLInputElement).value).toBe(
      "20000",
    );
  });

  it("submits with edited values and calls onSave/onClose", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EditItemModal item={item} zones={zones} onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Pintar living" } });
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "5" } });
    fireEvent.click(screen.getByText("Guardar ✓"));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    expect(saved.title).toBe("Pintar living");
    expect(saved.quantity).toBe(5);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
