export type CategoryColor = "food" | "sport" | "home" | "books" | "cloth" | "tech";

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
}
