import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddCategoryModal } from "./AddCategoryModal";

// jsdom does not implement HTMLDialogElement.showModal / close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("AddCategoryModal", () => {
  it("shows a validation error and does not call onAdd when the name is blank", () => {
    const onAdd = vi.fn();
    const { container } = render(<AddCategoryModal isOpen onClose={vi.fn()} onAdd={onAdd} />);
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByText(/nombre es obligatorio/i)).toBeTruthy();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("calls onAdd with the trimmed name and closes on a valid submit", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    const { container } = render(<AddCategoryModal isOpen onClose={onClose} onAdd={onAdd} />);
    fireEvent.change(screen.getByPlaceholderText(/limpieza/i), {
      target: { value: "  Farmacia  " },
    });
    fireEvent.submit(container.querySelector("form")!);
    expect(onAdd).toHaveBeenCalledWith("Farmacia");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
