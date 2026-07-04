"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ShoppingCategory, ShoppingItem } from "@/features/shopping-list/domain";
import {
  canDeleteCategory,
  groupItemsByCategory,
  validateCategoryName,
} from "@/features/shopping-list/domain";

interface Params {
  initialCategories: ShoppingCategory[];
  initialItems: ShoppingItem[];
  onSaveCategories: (categories: ShoppingCategory[]) => Promise<void> | void;
  onSaveItems: (items: ShoppingItem[]) => Promise<void> | void;
}

export function useShoppingList({
  initialCategories,
  initialItems,
  onSaveCategories,
  onSaveItems,
}: Params) {
  const [categories, setCategories] = useState<ShoppingCategory[]>(initialCategories);
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const categoriesRef = useRef(initialCategories);
  const itemsRef = useRef(initialItems);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const grouped = useMemo(() => groupItemsByCategory(categories, items), [categories, items]);

  const persistCategories = (next: ShoppingCategory[]) => {
    categoriesRef.current = next;
    setCategories(next);
    void onSaveCategories(next);
  };

  const persistItems = (next: ShoppingItem[]) => {
    itemsRef.current = next;
    setItems(next);
    void onSaveItems(next);
  };

  const handleAddCategory = (name: string) => {
    if (!validateCategoryName(name)) return;
    const newCategory: ShoppingCategory = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    persistCategories([...categoriesRef.current, newCategory]);
  };

  const handleRenameCategory = (id: string, name: string) => {
    if (!validateCategoryName(name)) return;
    const next = categoriesRef.current.map((category) =>
      category.id === id ? { ...category, name: name.trim() } : category
    );
    persistCategories(next);
  };

  const handleDeleteCategory = (id: string) => {
    if (!canDeleteCategory(id, itemsRef.current)) return;
    persistCategories(categoriesRef.current.filter((category) => category.id !== id));
  };

  const handleAddItem = ({ name, categoryId }: { name: string; categoryId: string }) => {
    if (!validateCategoryName(name)) return;
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      categoryId,
      checked: false,
      createdAt: new Date().toISOString(),
    };
    persistItems([...itemsRef.current, newItem]);
  };

  const handleEditItem = (id: string, { name, categoryId }: { name: string; categoryId: string }) => {
    if (!validateCategoryName(name)) return;
    const next = itemsRef.current.map((item) =>
      item.id === id ? { ...item, name: name.trim(), categoryId } : item
    );
    persistItems(next);
  };

  const handleDeleteItem = (id: string) => {
    persistItems(itemsRef.current.filter((item) => item.id !== id));
  };

  const handleCheckItem = (id: string) => {
    persistItems(itemsRef.current.filter((item) => item.id !== id));
  };

  return {
    grouped,
    handleAddCategory,
    handleRenameCategory,
    handleDeleteCategory,
    handleAddItem,
    handleEditItem,
    handleDeleteItem,
    handleCheckItem,
  };
}
