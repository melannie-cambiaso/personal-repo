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
    expect(screen.getByLabelText("Precio (CLP) *")).toBeTruthy();
    expect(screen.getByLabelText("Tag")).toBeTruthy();
    expect(screen.getByLabelText("Prioridad")).toBeTruthy();
    expect(screen.getByLabelText("URL del producto")).toBeTruthy();
    expect(screen.getByLabelText("URL de imagen")).toBeTruthy();
  });

  // Asserted on the `required` attribute itself rather than by submitting a blank
  // form: jsdom does not run constraint validation on submit, so a submit-based
  // test would pass whether or not the browser would actually block the user.
  it("requires the title and the price and nothing else", () => {
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={vi.fn()} />);

    expect((screen.getByLabelText("Título *") as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText("Precio (CLP) *") as HTMLInputElement).required).toBe(true);
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
    fireEvent.change(screen.getByLabelText("Precio (CLP) *"), { target: { value: "50000" } });

    expect((screen.getByLabelText("Título *") as HTMLInputElement).value).toBe("Auriculares");
    expect((screen.getByLabelText("Marca / Tienda") as HTMLInputElement).value).toBe("Sony");
    expect((screen.getByLabelText("Emoji") as HTMLInputElement).value).toBe("🎧");
    expect((screen.getByLabelText("Descripción") as HTMLTextAreaElement).value).toBe("Desc");
    expect((screen.getByLabelText("Precio (CLP) *") as HTMLInputElement).value).toBe("50000");
  });

  it("submits the fully-filled form and calls onAdd with every value", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<WishlistAddItemModal isOpen onClose={onClose} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Auriculares" } });
    fireEvent.change(screen.getByLabelText("Marca / Tienda"), { target: { value: "Sony" } });
    fireEvent.change(screen.getByLabelText("Emoji"), { target: { value: "🎧" } });
    fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "Desc" } });
    fireEvent.change(screen.getByLabelText("Precio (CLP) *"), { target: { value: "50000" } });
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

  // Blank optionals must arrive as `undefined`, not as empty strings — an item
  // carrying `brand: ""` would render an empty label instead of no label at all.
  it("submits with only a title and a price, leaving the untouched fields undefined", () => {
    const onAdd = vi.fn();
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Título *"), {
      target: { value: "Zapatillas negras" },
    });
    fireEvent.change(screen.getByLabelText("Precio (CLP) *"), { target: { value: "39990" } });
    fireEvent.click(screen.getByText("Agregar ✓"));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const submitted = onAdd.mock.calls[0][0] as WishlistItem;
    expect(submitted.title).toBe("Zapatillas negras");
    expect(submitted.brand).toBeUndefined();
    expect(submitted.emoji).toBeUndefined();
    expect(submitted.description).toBeUndefined();
    expect(submitted.price).toBe(39990);
    // Still categorized: the select carries a default, so it never blocks the user.
    expect(submitted.category).toEqual(CATEGORIES.food);
  });

  // jsdom skips constraint validation, so these submits reach the handler exactly
  // like a programmatic submit would — the handler itself must refuse them.
  it("does not save an item without a price", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<WishlistAddItemModal isOpen onClose={onClose} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Auriculares" } });
    fireEvent.click(screen.getByText("Agregar ✓"));

    expect(onAdd).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not save an item with a negative price", () => {
    const onAdd = vi.fn();
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Auriculares" } });
    fireEvent.change(screen.getByLabelText("Precio (CLP) *"), { target: { value: "-5" } });
    fireEvent.click(screen.getByText("Agregar ✓"));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("defaults a new item to medium priority and saves it", () => {
    const onAdd = vi.fn();
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={onAdd} />);

    expect((screen.getByLabelText("Prioridad") as HTMLSelectElement).value).toBe("medium");

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Auriculares" } });
    fireEvent.change(screen.getByLabelText("Precio (CLP) *"), { target: { value: "50000" } });
    fireEvent.click(screen.getByText("Agregar ✓"));

    expect((onAdd.mock.calls[0][0] as WishlistItem).priority).toBe("medium");
  });

  it("offers the priorities from highest to lowest", () => {
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={vi.fn()} />);

    const options = Array.from((screen.getByLabelText("Prioridad") as HTMLSelectElement).options);
    expect(options.map((o) => o.textContent)).toEqual(["Alta", "Media", "Baja"]);
    expect(options.map((o) => o.value)).toEqual(["high", "medium", "low"]);
  });

  it("saves the chosen priority", () => {
    const onAdd = vi.fn();
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Auriculares" } });
    fireEvent.change(screen.getByLabelText("Precio (CLP) *"), { target: { value: "50000" } });
    fireEvent.change(screen.getByLabelText("Prioridad"), { target: { value: "high" } });
    fireEvent.click(screen.getByText("Agregar ✓"));

    expect((onAdd.mock.calls[0][0] as WishlistItem).priority).toBe("high");
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

  it("shows Media when editing a legacy item saved without a priority", () => {
    const legacy: WishlistItem = {
      id: "1",
      title: "Zapatillas negras",
      category: CATEGORIES.cloth,
      price: 39990,
    };
    render(
      <WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={vi.fn()} editItem={legacy} />
    );

    expect((screen.getByLabelText("Prioridad") as HTMLSelectElement).value).toBe("medium");
  });

  it("keeps an edited item's priority", () => {
    const onAdd = vi.fn();
    const item: WishlistItem = {
      id: "1",
      title: "Zapatillas negras",
      category: CATEGORIES.cloth,
      price: 39990,
      priority: "low",
    };
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={onAdd} editItem={item} />);

    expect((screen.getByLabelText("Prioridad") as HTMLSelectElement).value).toBe("low");
    fireEvent.click(screen.getByText("Guardar ✓"));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: "1", priority: "low" }));
  });

  // Legacy rows may carry `price: null`; editing one must not round-trip that null.
  it("requires a price before saving a legacy item that has none", () => {
    const onAdd = vi.fn();
    const legacy: WishlistItem = {
      id: "1",
      title: "Zapatillas negras",
      category: CATEGORIES.cloth,
      price: null,
    };
    render(<WishlistAddItemModal isOpen onClose={vi.fn()} onAdd={onAdd} editItem={legacy} />);

    expect((screen.getByLabelText("Precio (CLP) *") as HTMLInputElement).value).toBe("");
    fireEvent.click(screen.getByText("Guardar ✓"));
    expect(onAdd).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Precio (CLP) *"), { target: { value: "39990" } });
    fireEvent.click(screen.getByText("Guardar ✓"));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect((onAdd.mock.calls[0][0] as WishlistItem).price).toBe(39990);
  });
});
