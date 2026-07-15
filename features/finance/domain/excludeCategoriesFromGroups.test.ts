import { describe, it, expect } from "vitest";
import { excludeCategoriesFromGroups } from "./excludeCategoriesFromGroups";

type Group = { name: string; type: "income" | "expense" | "refund"; categories: string[] };

describe("excludeCategoriesFromGroups", () => {
  it("returns groups unchanged when the exclusion list is empty", () => {
    const groups: Group[] = [
      { name: "Gastos fijos", type: "expense", categories: ["Arriendo", "Internet"] },
    ];
    const result = excludeCategoriesFromGroups(groups, []);
    expect(result).toEqual(groups);
  });

  it("removes an excluded category only from expense groups' categories arrays", () => {
    const groups: Group[] = [
      { name: "Gastos fijos", type: "expense", categories: ["Arriendo", "Internet"] },
    ];
    const result = excludeCategoriesFromGroups(groups, ["Internet"]);
    expect(result).toEqual([
      { name: "Gastos fijos", type: "expense", categories: ["Arriendo"] },
    ]);
  });

  it("leaves income and refund groups untouched even if a same-named category is excluded", () => {
    const groups: Group[] = [
      { name: "Sueldo", type: "income", categories: ["Internet"] },
      { name: "Devolución", type: "refund", categories: ["Internet"] },
      { name: "Gastos fijos", type: "expense", categories: ["Internet"] },
    ];
    const result = excludeCategoriesFromGroups(groups, ["Internet"]);
    expect(result).toEqual([
      { name: "Sueldo", type: "income", categories: ["Internet"] },
      { name: "Devolución", type: "refund", categories: ["Internet"] },
      { name: "Gastos fijos", type: "expense", categories: [] },
    ]);
  });

  it("yields an empty categories array (group stays) when every category in a group is excluded", () => {
    const groups: Group[] = [
      { name: "Gastos fijos", type: "expense", categories: ["Arriendo", "Internet"] },
    ];
    const result = excludeCategoriesFromGroups(groups, ["Arriendo", "Internet"]);
    expect(result).toEqual([{ name: "Gastos fijos", type: "expense", categories: [] }]);
  });
});
