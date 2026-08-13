import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PendingTab } from "./PendingTab";
import type { PendingTabView } from "./pendingTabView";

const readyView: PendingTabView = {
  status: "ready",
  view: {
    rows: [
      { id: "c1", name: "Arriendo", bucket: "fixed", computed: 30000, amount: 30000, isOverridden: false },
      { id: "c2", name: "Ocio", bucket: "variable", computed: 20000, amount: 12000, isOverridden: true },
    ],
    total: 42000,
  },
};

const emptyView: PendingTabView = { status: "ready", view: { rows: [], total: 0 } };
const loadingView: PendingTabView = { status: "loading" };

const noop = () => {};

describe("PendingTab", () => {
  it("the toggle label and aria-pressed reflect mode, and clicking it calls onToggleMode once", () => {
    const onToggleMode = vi.fn();
    render(<PendingTab mode="view" onToggleMode={onToggleMode} view={readyView} onOverrideBlur={noop} />);

    const toggle = screen.getByRole("button", { name: "Editar" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggle);

    expect(onToggleMode).toHaveBeenCalledOnce();
  });

  it("renders a total row above the list reflecting the sum of computed and overridden rows", () => {
    render(<PendingTab mode="view" onToggleMode={noop} view={readyView} onOverrideBlur={noop} />);

    const total = screen.getByText("$42.000");
    const arriendo = screen.getByText("Arriendo");
    expect(total.compareDocumentPosition(arriendo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders one row per leaf, showing both the computed default and the overridden displayed value", () => {
    render(<PendingTab mode="view" onToggleMode={noop} view={readyView} onOverrideBlur={noop} />);

    expect(screen.getByText("Arriendo")).toBeTruthy();
    expect(screen.getByText("$30.000")).toBeTruthy();
    expect(screen.getByText("Ocio")).toBeTruthy();
    expect(screen.getByText("$12.000")).toBeTruthy();
  });

  it("edit mode blur on a row delegates to onOverrideBlur with the leaf id", () => {
    const onOverrideBlur = vi.fn();
    render(<PendingTab mode="edit" onToggleMode={noop} view={readyView} onOverrideBlur={onOverrideBlur} />);

    fireEvent.blur(screen.getByLabelText("Pendiente de Arriendo"), { target: { value: "5000" } });

    expect(onOverrideBlur).toHaveBeenCalledWith("c1", "5000");
  });

  it("never renders a savings-bucket row (Expense-Only Scope)", () => {
    render(<PendingTab mode="view" onToggleMode={noop} view={readyView} onOverrideBlur={noop} />);

    expect(screen.queryByText("Ahorro emergencia")).toBeNull();
  });

  it("empty state renders an explicit empty message and total $0", () => {
    render(<PendingTab mode="view" onToggleMode={noop} view={emptyView} onOverrideBlur={noop} />);

    expect(screen.getByText("No hay categorías cargadas")).toBeTruthy();
    expect(screen.getByText("$0")).toBeTruthy();
  });

  it("loading state renders neither the total row nor any leaf rows", () => {
    render(<PendingTab mode="view" onToggleMode={noop} view={loadingView} onOverrideBlur={noop} />);

    expect(screen.queryByText("$42.000")).toBeNull();
    expect(screen.queryByText("Arriendo")).toBeNull();
  });
});
