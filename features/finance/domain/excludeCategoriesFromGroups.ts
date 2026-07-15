// Local type alias — mirrors Group from kvAdapter without pulling in server-only
type Group = { name: string; type: "income" | "expense" | "refund"; categories: string[] };

/**
 * Filters excluded categories out of expense groups only. Income/refund groups
 * pass through untouched, even if a same-named category appears in the exclusion
 * list — exclusion is expense-only, mirroring the existing `closed` idiom.
 */
export function excludeCategoriesFromGroups(groups: Group[], excluded: string[]): Group[] {
  const excludedSet = new Set(excluded);
  return groups.map((group) =>
    group.type === "expense"
      ? { ...group, categories: group.categories.filter((c) => !excludedSet.has(c)) }
      : group
  );
}
