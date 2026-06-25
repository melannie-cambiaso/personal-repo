import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ActivityLogList } from "./ActivityLogList";
import type { ActivityLogEntry } from "@/features/activity-log/domain";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = "2026-06-25";
const YESTERDAY = "2026-06-24";

const entry = (
  id: string,
  person: ActivityLogEntry["person"],
  date: string,
): ActivityLogEntry => ({
  id,
  date,
  person,
  activity: `Activity ${id}`,
  createdAt: `${date}T10:00:00Z`,
});

// ---------------------------------------------------------------------------
// Setup: pin clock to TODAY
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-25T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Scenario: today renders as flat list
// ---------------------------------------------------------------------------

describe("ActivityLogList — today renders flat list", () => {
  it("renders flat ActivityLogEntryCards for today's entries", () => {
    const entries = [
      entry("1", "Meme", TODAY),
      entry("2", "Pedro", TODAY),
    ];
    render(
      <ActivityLogList
        entries={entries}
        onDelete={vi.fn()}
        selectedMonth="2026-06"
      />,
    );
    expect(screen.getByText("Activity 1")).toBeDefined();
    expect(screen.getByText("Activity 2")).toBeDefined();
  });

  it("does not render ActivityLogPersonGroup for today's entries", () => {
    const entries = [
      entry("1", "Meme", TODAY),
      entry("2", "Pedro", TODAY),
    ];
    render(
      <ActivityLogList
        entries={entries}
        onDelete={vi.fn()}
        selectedMonth="2026-06"
      />,
    );
    // Person group renders an h4 with the person name + a count badge.
    // The flat list renders person names inside small badge spans inside cards.
    // We check that there is no h4 (person group heading) rendered.
    expect(document.querySelector("h4")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Scenario: past day renders person groups alphabetically
// ---------------------------------------------------------------------------

describe("ActivityLogList — past day renders person groups alphabetically", () => {
  it("renders two person groups for Meme and Pedro", () => {
    const entries = [
      entry("1", "Pedro", YESTERDAY),
      entry("2", "Meme", YESTERDAY),
    ];
    render(
      <ActivityLogList
        entries={entries}
        onDelete={vi.fn()}
        selectedMonth="2026-06"
      />,
    );
    const headings = document.querySelectorAll("h4");
    expect(headings.length).toBe(2);
  });

  it("renders Meme before Pedro (alphabetical order)", () => {
    const entries = [
      entry("1", "Pedro", YESTERDAY),
      entry("2", "Meme", YESTERDAY),
    ];
    render(
      <ActivityLogList
        entries={entries}
        onDelete={vi.fn()}
        selectedMonth="2026-06"
      />,
    );
    const headings = Array.from(document.querySelectorAll("h4")).map(
      (h) => h.textContent,
    );
    expect(headings[0]).toBe("Meme");
    expect(headings[1]).toBe("Pedro");
  });
});

// ---------------------------------------------------------------------------
// Scenario: past day with single person
// ---------------------------------------------------------------------------

describe("ActivityLogList — past day with single person", () => {
  it("renders only one person group when only Pedro has entries", () => {
    const entries = [
      entry("1", "Pedro", YESTERDAY),
      entry("2", "Pedro", YESTERDAY),
    ];
    render(
      <ActivityLogList
        entries={entries}
        onDelete={vi.fn()}
        selectedMonth="2026-06"
      />,
    );
    const headings = document.querySelectorAll("h4");
    expect(headings.length).toBe(1);
    expect(headings[0]!.textContent).toBe("Pedro");
  });
});
