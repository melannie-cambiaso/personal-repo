import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ActivityLogPersonGroup } from "./ActivityLogPersonGroup";
import type { ActivityLogEntry } from "@/features/activity-log/domain";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const entry = (id: string): ActivityLogEntry => ({
  id,
  date: "2026-06-20",
  person: "Meme",
  activity: `Activity ${id}`,
  createdAt: "2026-06-20T10:00:00Z",
});

const threeEntries = [entry("1"), entry("2"), entry("3")];
const fiveEntries = [entry("1"), entry("2"), entry("3"), entry("4"), entry("5")];

// ---------------------------------------------------------------------------
// ≤3 entries — no toggle
// ---------------------------------------------------------------------------

describe("ActivityLogPersonGroup — ≤3 entries", () => {
  it("renders all entries when there are 3 or fewer", () => {
    render(
      <ActivityLogPersonGroup
        person="Meme"
        entries={threeEntries}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Activity 1")).toBeDefined();
    expect(screen.getByText("Activity 2")).toBeDefined();
    expect(screen.getByText("Activity 3")).toBeDefined();
  });

  it("does not render a toggle button when entries.length <= 3", () => {
    render(
      <ActivityLogPersonGroup
        person="Meme"
        entries={threeEntries}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /ver más/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ver menos/i })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// >3 entries — collapsed by default
// ---------------------------------------------------------------------------

describe("ActivityLogPersonGroup — >3 entries (collapsed)", () => {
  it("renders exactly 3 entries on first render", () => {
    render(
      <ActivityLogPersonGroup
        person="Meme"
        entries={fiveEntries}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Activity 1")).toBeDefined();
    expect(screen.getByText("Activity 2")).toBeDefined();
    expect(screen.getByText("Activity 3")).toBeDefined();
    expect(screen.queryByText("Activity 4")).toBeNull();
    expect(screen.queryByText("Activity 5")).toBeNull();
  });

  it("shows 'Ver más (N)' button where N = entries.length - 3", () => {
    render(
      <ActivityLogPersonGroup
        person="Meme"
        entries={fiveEntries}
        onDelete={vi.fn()}
      />,
    );
    // N = 5 - 3 = 2
    expect(screen.getByText("Ver más (2)")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Expand: clicking "Ver más" shows all entries
// ---------------------------------------------------------------------------

describe("ActivityLogPersonGroup — expand on click", () => {
  it("shows all entries after clicking 'Ver más'", () => {
    render(
      <ActivityLogPersonGroup
        person="Meme"
        entries={fiveEntries}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Ver más (2)"));
    expect(screen.getByText("Activity 4")).toBeDefined();
    expect(screen.getByText("Activity 5")).toBeDefined();
  });

  it("changes toggle text to 'Ver menos' after expanding", () => {
    render(
      <ActivityLogPersonGroup
        person="Meme"
        entries={fiveEntries}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Ver más (2)"));
    expect(screen.getByText("Ver menos")).toBeDefined();
    expect(screen.queryByText("Ver más (2)")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Collapse: clicking "Ver menos" hides extras
// ---------------------------------------------------------------------------

describe("ActivityLogPersonGroup — collapse on second click", () => {
  it("hides extra entries and restores 'Ver más (N)' after collapsing", () => {
    render(
      <ActivityLogPersonGroup
        person="Meme"
        entries={fiveEntries}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Ver más (2)"));
    fireEvent.click(screen.getByText("Ver menos"));
    expect(screen.queryByText("Activity 4")).toBeNull();
    expect(screen.queryByText("Activity 5")).toBeNull();
    expect(screen.getByText("Ver más (2)")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Count badge always shows total
// ---------------------------------------------------------------------------

describe("ActivityLogPersonGroup — count badge", () => {
  it("shows total entry count in badge (not visible count)", () => {
    render(
      <ActivityLogPersonGroup
        person="Meme"
        entries={fiveEntries}
        onDelete={vi.fn()}
      />,
    );
    // Collapsed: only 3 visible, but badge must show 5
    expect(screen.getByText("5")).toBeDefined();
  });
});
