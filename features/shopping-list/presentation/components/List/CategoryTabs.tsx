"use client";

import type { ShoppingCategory } from "@/features/shopping-list/domain";

interface Props {
  categories: ShoppingCategory[];
  activeCategoryId: string | null;
  isOwner: boolean;
  onSelect: (categoryId: string) => void;
  onAddCategory: () => void;
  onRenameCategory: (category: ShoppingCategory) => void;
  onDeleteCategory: (category: ShoppingCategory) => void;
}

export function CategoryTabs({
  categories,
  activeCategoryId,
  isOwner,
  onSelect,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}: Props) {
  if (categories.length === 0 && !isOwner) {
    return null;
  }

  return (
    <div className="border-cream-300 mb-8 flex flex-wrap items-center gap-2 border-b pb-3">
      {categories.map((category) => {
        const isActive = category.id === activeCategoryId;
        return (
          <div key={category.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(category.id)}
              aria-pressed={isActive}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-brown-800 text-white"
                  : "bg-cream-100 text-brown-600 hover:bg-cream-200"
              }`}
            >
              {category.name}
            </button>
            {isOwner && isActive && (
              <>
                <button
                  type="button"
                  onClick={() => onRenameCategory(category)}
                  aria-label={`Renombrar ${category.name}`}
                  className="text-brown-400 hover:text-brown-800 cursor-pointer text-xs transition-colors"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCategory(category)}
                  aria-label={`Eliminar ${category.name}`}
                  className="text-brown-300 cursor-pointer text-xs transition-colors hover:text-red-500"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        );
      })}

      {isOwner && (
        <button
          type="button"
          onClick={onAddCategory}
          aria-label="Agregar categoría"
          className="text-brown-500 hover:text-brown-800 border-cream-400 cursor-pointer rounded-full border border-dashed px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          + Categoría
        </button>
      )}
    </div>
  );
}
