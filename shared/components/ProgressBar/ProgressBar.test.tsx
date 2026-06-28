import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

function getFillElement(container: HTMLElement): HTMLElement {
  // The fill div is the first child of the outer container div
  return container.firstElementChild!.firstElementChild as HTMLElement;
}

describe("ProgressBar", () => {
  it("value=0 renders fill at 0%", () => {
    const { container } = render(<ProgressBar value={0} />);
    expect(getFillElement(container).style.width).toBe("0%");
  });

  it("value=1 renders fill at 100%", () => {
    const { container } = render(<ProgressBar value={1} />);
    expect(getFillElement(container).style.width).toBe("100%");
  });

  it("value=0.5 renders fill at 50%", () => {
    const { container } = render(<ProgressBar value={0.5} />);
    expect(getFillElement(container).style.width).toBe("50%");
  });

  it("value=1.5 is clamped to 100%", () => {
    const { container } = render(<ProgressBar value={1.5} />);
    expect(getFillElement(container).style.width).toBe("100%");
  });

  it("value=-0.3 is clamped to 0%", () => {
    const { container } = render(<ProgressBar value={-0.3} />);
    expect(getFillElement(container).style.width).toBe("0%");
  });

  it("className prop is applied to the container element", () => {
    const { container } = render(<ProgressBar value={0.5} className="my-custom-class" />);
    expect(container.firstElementChild!.classList.contains("my-custom-class")).toBe(true);
  });
});
