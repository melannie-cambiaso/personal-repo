import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PendingLeafRow } from "./PendingLeafRow";
import type { PendingRow } from "@/features/finance-v2/domain";

const row: PendingRow = {
  id: "c1",
  name: "Arriendo",
  bucket: "fixed",
  computed: 30000,
  amount: 30000,
  isOverridden: false,
};

const noop = () => {};

describe("PendingLeafRow", () => {
  describe("view mode", () => {
    it("renders the formatted amount and no input", () => {
      render(<PendingLeafRow mode="view" row={row} onOverrideBlur={noop} />);

      expect(screen.getByText("$30.000")).toBeTruthy();
      expect(screen.queryByLabelText("Pendiente de Arriendo")).toBeNull();
    });

    it("renders the leaf name", () => {
      render(<PendingLeafRow mode="view" row={row} onOverrideBlur={noop} />);

      expect(screen.getByText("Arriendo")).toBeTruthy();
    });
  });

  describe("edit mode", () => {
    it("renders an uncontrolled amount input pre-filled with the row's amount", () => {
      render(<PendingLeafRow mode="edit" row={row} onOverrideBlur={noop} />);

      const input = screen.getByLabelText("Pendiente de Arriendo") as HTMLInputElement;
      expect(input.value).toBe("30000");
    });

    it("blur fires onOverrideBlur with the leaf id and the raw typed value", () => {
      const onOverrideBlur = vi.fn();
      render(<PendingLeafRow mode="edit" row={row} onOverrideBlur={onOverrideBlur} />);

      fireEvent.blur(screen.getByLabelText("Pendiente de Arriendo"), { target: { value: "12000" } });

      expect(onOverrideBlur).toHaveBeenCalledWith("c1", "12000");
    });

    it("renders no formatted amount span", () => {
      render(<PendingLeafRow mode="edit" row={row} onOverrideBlur={noop} />);

      expect(screen.queryByText("$30.000")).toBeNull();
    });
  });
});
