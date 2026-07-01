import type { Category } from "../domain/Category";

export const CATEGORIES = {
  food: { id: "food", name: "Comida & Bebida", color: "food" },
  sport: { id: "sport", name: "Deporte", color: "sport" },
  cloth: { id: "cloth", name: "Ropa", color: "cloth" },
  tech: { id: "tech", name: "Tecnología", color: "tech" },
  home: { id: "home", name: "Hogar", color: "home" },
  books: { id: "books", name: "Libros", color: "books" },
} satisfies Record<string, Category>;
