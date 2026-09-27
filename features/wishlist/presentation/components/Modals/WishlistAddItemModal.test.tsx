import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WishlistAddItemModal } from "./WishlistAddItemModal";
import { CATEGORIES } from "@/features/wishlist/data";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("WishlistAddItemModal", () => {
  it("renders every form field", () => {
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByLabelText("Título *")).toBeTruthy();
    expect(screen.getByLabelText("Marca / Tienda")).toBeTruthy();
    expect(screen.getByLabelText("Categoría")).toBeTruthy();
    expect(screen.getByLabelText("Emoji")).toBeTruthy();
    expect(screen.getByLabelText("Descripción")).toBeTruthy();
    expect(screen.getByLabelText("Precio (CLP)")).toBeTruthy();
    expect(screen.getByLabelText("Tag")).toBeTruthy();
    expect(screen.getByLabelText("URL del producto")).toBeTruthy();
    expect(screen.getByLabelText("URL de imagen")).toBeTruthy();
  });

  // Asserted on the `required` attribute itself rather than by submitting a blank
  // form: jsdom does not run constraint validation on submit, so a submit-based
  // test would pass whether or not the browser would actually block the user.
  it("requires the title and nothing else", () => {
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={vi.fn()} />);

    expect((screen.getByLabelText("Título *") as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText("Marca / Tienda") as HTMLInputElement).required).toBe(false);
    expect((screen.getByLabelText("Emoji") as HTMLInputElement).required).toBe(false);
    expect((screen.getByLabelText("Descripción") as HTMLTextAreaElement).required).toBe(false);
  });

  // The `*` alone is a subtle signal. This line is what actually tells the reader
  // they may stop after the title, so it is pinned like any other behavior.
  it("tells the reader the rest of the form can wait", () => {
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={vi.fn()} />);

    expect(screen.getByText("Lo demás es opcional — podés completarlo después")).toBeTruthy();
  });

  it("lets the user type into every field", () => {
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Auriculares" } });
    fireEvent.change(screen.getByLabelText("Marca / Tienda"), { target: { value: "Sony" } });
    fireEvent.change(screen.getByLabelText("Emoji"), { target: { value: "🎧" } });
    fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "Desc" } });
    fireEvent.change(screen.getByLabelText("Precio (CLP)"), { target: { value: "50000" } });

    expect((screen.getByLabelText("Título *") as HTMLInputElement).value).toBe("Auriculares");
    expect((screen.getByLabelText("Marca / Tienda") as HTMLInputElement).value).toBe("Sony");
    expect((screen.getByLabelText("Emoji") as HTMLInputElement).value).toBe("🎧");
    expect((screen.getByLabelText("Descripción") as HTMLTextAreaElement).value).toBe("Desc");
    expect((screen.getByLabelText("Precio (CLP)") as HTMLInputElement).value).toBe("50000");
  });

  it("submits the fully-filled form and calls onAdd with every value", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<WishlistAddItemModal isOpen onClose={onClose} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Auriculares" } });
    fireEvent.change(screen.getByLabelText("Marca / Tienda"), { target: { value: "Sony" } });
    fireEvent.change(screen.getByLabelText("Emoji"), { target: { value: "🎧" } });
    fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "Desc" } });
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

  // The whole point of the change: jotting down a passing idea costs one field.
  // Blank optionals must arrive as `undefined`, not as empty strings — an item
  // carrying `brand: ""` would render an empty label instead of no label at all.
  it("submits with only a title, leaving the untouched fields undefined", () => {
    const onAdd = vi.fn();
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Título *"), {
      target: { value: "Zapatillas negras" },
    });
    fireEvent.click(screen.getByText("Agregar ✓"));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const submitted = onAdd.mock.calls[0][0] as WishlistItem;
    expect(submitted.title).toBe("Zapatillas negras");
    expect(submitted.brand).toBeUndefined();
    expect(submitted.emoji).toBeUndefined();
    expect(submitted.description).toBeUndefined();
    expect(submitted.price).toBeNull();
    // Still categorized: the select carries a default, so it never blocks the user.
    expect(submitted.category).toEqual(CATEGORIES.food);
  });

  // Regression guard for the widened domain type: an item saved through the quick
  // path has no brand/emoji/description, and reopening it to enrich it must not
  // feed `undefined` into the controlled inputs.
  it("opens an item saved without optional fields for editing", () => {
    const sparse: WishlistItem = {
      id: "1",
      title: "Zapatillas negras",
      category: CATEGORIES.cloth,
      price: null,
    };
    render(
      <WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={vi.fn()} editItem={sparse} />
    );

    expect((screen.getByLabelText("Título *") as HTMLInputElement).value).toBe(
      "Zapatillas negras"
    );
    expect((screen.getByLabelText("Marca / Tienda") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Emoji") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Descripción") as HTMLTextAreaElement).value).toBe("");
  });
});
