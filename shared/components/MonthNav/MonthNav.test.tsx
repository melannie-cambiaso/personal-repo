import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MonthNav } from "./MonthNav";

describe("MonthNav", () => {
  it("renders the label", () => {
    render(<MonthNav label="julio 2026" onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByText("julio 2026")).toBeTruthy();
  });

  it("calls onPrev when the prev button is clicked", () => {
    const onPrev = vi.fn();
    render(<MonthNav label="julio 2026" onPrev={onPrev} onNext={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "← Anterior" }));
    expect(onPrev).toHaveBeenCalledOnce();
  });

  it("calls onNext when the next button is clicked", () => {
    const onNext = vi.fn();
    render(<MonthNav label="julio 2026" onPrev={vi.fn()} onNext={onNext} />);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("disables both buttons when disabled is true", () => {
    render(<MonthNav label="julio 2026" onPrev={vi.fn()} onNext={vi.fn()} disabled />);
    expect((screen.getByRole("button", { name: "← Anterior" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Siguiente →" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("leaves both buttons enabled when disabled is omitted (v1's existing call site)", () => {
    render(<MonthNav label="julio 2026" onPrev={vi.fn()} onNext={vi.fn()} />);
    expect((screen.getByRole("button", { name: "← Anterior" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: "Siguiente →" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
