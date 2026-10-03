import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditEntryModal } from "./EditEntryModal";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";

// jsdom does not implement HTMLDialogElement.showModal / close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const makeEntry = (overrides: Partial<SavingsEntry> = {}): SavingsEntry => ({
  id: "e1",
  type: "gasto",
  amount: 500,
  date: "2026-01-15",
  notes: "dentista",
  toReplenish: true,
  createdAt: "2026-01-15T00:00:00Z",
  ...overrides,
});

const getAmount = () => screen.getByLabelText("Monto * ($)") as HTMLInputElement;
const getDate = () => screen.getByLabelText("Fecha *") as HTMLInputElement;
const getNotes = () => screen.getByLabelText("Notas") as HTMLTextAreaElement;
const getReplenish = () => screen.getByRole("checkbox", { hidden: true }) as HTMLInputElement;

describe("EditEntryModal", () => {
  it("shows the entry's values when opened", () => {
    render(<EditEntryModal entry={makeEntry()} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(getAmount().value).toBe("500");
    expect(getDate().value).toBe("2026-01-15");
    expect(getNotes().value).toBe("dentista");
    expect(getReplenish().checked).toBe(true);
  });

  it("shows the entry's values when it is opened after mounting closed", () => {
    const { rerender } = render(<EditEntryModal entry={null} onClose={vi.fn()} onSave={vi.fn()} />);
    rerender(
      <EditEntryModal entry={makeEntry({ amount: 42 })} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(getAmount().value).toBe("42");
    expect(getNotes().value).toBe("dentista");
  });

  it("discards edits when reopened with another entry", () => {
    const { rerender } = render(
      <EditEntryModal entry={makeEntry()} onClose={vi.fn()} onSave={vi.fn()} />
    );
    fireEvent.change(getAmount(), { target: { value: "999" } });
    fireEvent.change(getNotes(), { target: { value: "edited" } });

    rerender(<EditEntryModal entry={null} onClose={vi.fn()} onSave={vi.fn()} />);
    rerender(
      <EditEntryModal
        entry={makeEntry({ id: "e2", amount: 75, date: "2026-02-01", notes: undefined })}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(getAmount().value).toBe("75");
    expect(getDate().value).toBe("2026-02-01");
    expect(getNotes().value).toBe("");
  });

  it("discards edits when the same entry is passed again after closing", () => {
    const entry = makeEntry();
    const { rerender } = render(
      <EditEntryModal entry={entry} onClose={vi.fn()} onSave={vi.fn()} />
    );
    fireEvent.change(getAmount(), { target: { value: "999" } });
    fireEvent.click(getReplenish());

    rerender(<EditEntryModal entry={null} onClose={vi.fn()} onSave={vi.fn()} />);
    rerender(<EditEntryModal entry={entry} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(getAmount().value).toBe("500");
    expect(getReplenish().checked).toBe(true);
  });

  it("saves the edited values merged into the entry", () => {
    const onSave = vi.fn();
    render(<EditEntryModal entry={makeEntry()} onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(getAmount(), { target: { value: "650" } });
    fireEvent.click(screen.getByText("Guardar ✓"));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: "e1", amount: 650 }));
  });
});
