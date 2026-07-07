import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntryFormFields } from "./EntryFormFields";

type EntryField = "amount" | "date" | "notes" | "toReplenish";

const baseForm = { amount: "", date: "2026-01-01", notes: "", toReplenish: false };

function Harness({ showReplenish }: { showReplenish: boolean }) {
  const [form, setForm] = useState(baseForm);
  const setField =
    (field: EntryField) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = field === "toReplenish" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  return (
    <EntryFormFields
      form={form}
      showReplenish={showReplenish}
      setField={setField}
      amountPlaceholder="0"
    />
  );
}

describe("EntryFormFields", () => {
  it("renders amount, date, and notes fields", () => {
    render(<Harness showReplenish={false} />);
    expect(screen.getByLabelText("Monto * ($)")).toBeTruthy();
    expect(screen.getByLabelText("Fecha *")).toBeTruthy();
    expect(screen.getByLabelText("Notas")).toBeTruthy();
  });

  it("hides the replenish checkbox when showReplenish is false", () => {
    render(<Harness showReplenish={false} />);
    expect(screen.queryByText("A reponer este mes")).toBeNull();
  });

  it("shows the replenish checkbox when showReplenish is true", () => {
    render(<Harness showReplenish={true} />);
    expect(screen.getByText("A reponer este mes")).toBeTruthy();
  });

  it("lets the user type an amount and a date", () => {
    render(<Harness showReplenish={false} />);
    fireEvent.change(screen.getByLabelText("Monto * ($)"), { target: { value: "1000" } });
    fireEvent.change(screen.getByLabelText("Fecha *"), { target: { value: "2026-02-14" } });
    expect((screen.getByLabelText("Monto * ($)") as HTMLInputElement).value).toBe("1000");
    expect((screen.getByLabelText("Fecha *") as HTMLInputElement).value).toBe("2026-02-14");
  });
});
