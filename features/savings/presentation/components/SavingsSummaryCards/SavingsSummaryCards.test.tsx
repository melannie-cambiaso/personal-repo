import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SavingsSummaryCards } from "./SavingsSummaryCards";

const baseProps = {
  balance: 8000,
  totalToReplenish: 0,
  totalDepositos: 3000,
  totalGastos: 0,
};

describe("SavingsSummaryCards", () => {
  it("shows a Monto inicial row when initialAmount is set and nonzero", () => {
    render(<SavingsSummaryCards {...baseProps} initialAmount={5000} />);
    expect(screen.getByText("Monto inicial")).toBeTruthy();
    expect(screen.getByText("$5.000")).toBeTruthy();
  });

  it("does not show a Monto inicial row when initialAmount is undefined", () => {
    render(<SavingsSummaryCards {...baseProps} />);
    expect(screen.queryByText("Monto inicial")).toBeNull();
  });

  it("does not show a Monto inicial row when initialAmount is zero", () => {
    render(<SavingsSummaryCards {...baseProps} initialAmount={0} />);
    expect(screen.queryByText("Monto inicial")).toBeNull();
  });
});
