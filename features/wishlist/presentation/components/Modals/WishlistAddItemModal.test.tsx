import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WishlistAddItemModal } from "./WishlistAddItemModal";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("WishlistAddItemModal", () => {
  it("renders every form field", () => {
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByLabelText("Título *")).toBeTruthy();
    expect(screen.getByLabelText("Marca / Tienda *")).toBeTruthy();
    expect(screen.getByLabelText("Categoría *")).toBeTruthy();
    expect(screen.getByLabelText("Emoji *")).toBeTruthy();
    expect(screen.getByLabelText("Descripción *")).toBeTruthy();
    expect(screen.getByLabelText("Precio (CLP)")).toBeTruthy();
    expect(screen.getByLabelText("Tag")).toBeTruthy();
    expect(screen.getByLabelText("URL del producto")).toBeTruthy();
    expect(screen.getByLabelText("URL de imagen")).toBeTruthy();
  });

  it("lets the user type into every field", () => {
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Auriculares" } });
    fireEvent.change(screen.getByLabelText("Marca / Tienda *"), { target: { value: "Sony" } });
    fireEvent.change(screen.getByLabelText("Emoji *"), { target: { value: "🎧" } });
    fireEvent.change(screen.getByLabelText("Descripción *"), { target: { value: "Desc" } });
    fireEvent.change(screen.getByLabelText("Precio (CLP)"), { target: { value: "50000" } });

    expect((screen.getByLabelText("Título *") as HTMLInputElement).value).toBe("Auriculares");
    expect((screen.getByLabelText("Marca / Tienda *") as HTMLInputElement).value).toBe("Sony");
    expect((screen.getByLabelText("Emoji *") as HTMLInputElement).value).toBe("🎧");
    expect((screen.getByLabelText("Descripción *") as HTMLTextAreaElement).value).toBe("Desc");
    expect((screen.getByLabelText("Precio (CLP)") as HTMLInputElement).value).toBe("50000");
  });

  it("submits the fully-filled form and calls onAdd with every value", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<WishlistAddItemModal isOpen onClose={onClose} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Auriculares" } });
    fireEvent.change(screen.getByLabelText("Marca / Tienda *"), { target: { value: "Sony" } });
    fireEvent.change(screen.getByLabelText("Emoji *"), { target: { value: "🎧" } });
    fireEvent.change(screen.getByLabelText("Descripción *"), { target: { value: "Desc" } });
    fireEvent.change(screen.getByLabelText("Precio (CLP)"), { target: { value: "50000" } });
    fireEvent.change(screen.getByLabelText("Tag"), { target: { value: "Deseado" } });
    fireEvent.click(screen.getByText("Agregar ✓"));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const submitted = onAdd.mock.calls[0][0];
    expect(submitted.title).toBe("Auriculares");
    expect(submitted.brand).toBe("Sony");
    expect(submitted.emoji).toBe("🎧");
    expect(submitted.description).toBe("Desc");
    expect(submitted.price).toBe(50000);
    expect(submitted.tag).toBe("Deseado");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
