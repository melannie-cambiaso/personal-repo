export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** Ascending, inclusive window of `2 * radius + 1` months centered on `center`
 *  (`center` lands at index `radius`). Built by walking `prevMonth`/`nextMonth`
 *  — no free text, no unbounded values (used by a picker `<Select>`). */
export function monthWindow(center: string, radius: number): string[] {
  const before: string[] = [];
  let cursor = center;
  for (let i = 0; i < radius; i++) {
    cursor = prevMonth(cursor);
    before.unshift(cursor);
  }

  const after: string[] = [];
  cursor = center;
  for (let i = 0; i < radius; i++) {
    cursor = nextMonth(cursor);
    after.push(cursor);
  }

  return [...before, center, ...after];
}
