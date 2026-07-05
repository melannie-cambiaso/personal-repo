"use client";

import { useEffect, useMemo, useState } from "react";
import type { ShoppingCategory, ShoppingItem } from "@/features/shopping-list/domain";
import { useShoppingList } from "../../hooks/useShoppingList";
import {
  CategoryTabs,
  ShoppingItemList,
  AddCategoryModal,
  EditCategoryModal,
  DeleteCategoryConfirmModal,
  AddItemModal,
  EditItemModal,
  DeleteItemConfirmModal,
} from "../../components";
import { PageHeader, AddButton } from "@/shared/components";

interface Props {
  initialCategories: ShoppingCategory[];
  initialItems: ShoppingItem[];
  isOwner: boolean;
  onSaveCategories: (categories: ShoppingCategory[]) => Promise<void> | void;
  onSaveItems: (items: ShoppingItem[]) => Promise<void> | void;
}

export function ShoppingListScreen({
  initialCategories,
  initialItems,
  isOwner,
  onSaveCategories,
  onSaveItems,
}: Props) {
  const {
    grouped,
    handleAddCategory,
    handleRenameCategory,
    handleDeleteCategory,
    handleAddItem,
    handleEditItem,
    handleDeleteItem,
    handleCheckItem,
  } = useShoppingList({
    initialCategories,
    initialItems,
    onSaveCategories,
    onSaveItems,
  });

  const categories = useMemo(() => grouped.map((group) => group.category), [grouped]);
  const items = useMemo(() => grouped.flatMap((group) => group.items), [grouped]);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      if (activeCategoryId !== null) setActiveCategoryId(null);
      return;
    }
    const stillExists = categories.some((category) => category.id === activeCategoryId);
    if (!stillExists) setActiveCategoryId(categories[0].id);
  }, [categories, activeCategoryId]);

  // Category modal state
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ShoppingCategory | null>(null);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<ShoppingCategory | null>(
    null
  );

  // Item modal state
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<ShoppingItem | null>(null);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Organizá tus compras" title="Lista de compras">
        <div className="text-cream-100/80 flex justify-center gap-6 text-sm">
          <span>
            {categories.length} categoría{categories.length !== 1 ? "s" : ""}
          </span>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <CategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          isOwner={isOwner}
          onSelect={setActiveCategoryId}
          onAddCategory={() => setAddCategoryOpen(true)}
          onRenameCategory={setEditingCategory}
          onDeleteCategory={setPendingDeleteCategory}
        />

        <div className="mb-6 flex justify-end">
          {isOwner && categories.length > 0 && (
            <AddButton onClick={() => setAddItemOpen(true)} label="Agregar producto" />
          )}
        </div>

        <ShoppingItemList
          grouped={grouped}
          activeCategoryId={activeCategoryId}
          isOwner={isOwner}
          onCheckItem={handleCheckItem}
          onEditItem={setEditingItem}
          onDeleteItem={setPendingDeleteItem}
        />
      </div>

      <AddCategoryModal
        key={addCategoryOpen ? "category-open" : "category-closed"}
        isOpen={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
        onAdd={(name) => {
          handleAddCategory(name);
          setAddCategoryOpen(false);
        }}
      />
      <EditCategoryModal
        key={editingCategory?.id}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSave={(id, name) => {
          handleRenameCategory(id, name);
          setEditingCategory(null);
        }}
      />
      <DeleteCategoryConfirmModal
        category={pendingDeleteCategory}
        items={items}
        onConfirm={() => {
          if (pendingDeleteCategory) {
            handleDeleteCategory(pendingDeleteCategory.id);
            setPendingDeleteCategory(null);
          }
        }}
        onCancel={() => setPendingDeleteCategory(null)}
      />

      <AddItemModal
        key={addItemOpen ? "item-open" : "item-closed"}
        isOpen={addItemOpen}
        categories={categories}
        defaultCategoryId={activeCategoryId ?? undefined}
        onClose={() => setAddItemOpen(false)}
        onAdd={(data) => {
          handleAddItem(data);
          setAddItemOpen(false);
        }}
      />
      <EditItemModal
        key={editingItem?.id}
        item={editingItem}
        categories={categories}
        onClose={() => setEditingItem(null)}
        onSave={(id, data) => {
          handleEditItem(id, data);
          setEditingItem(null);
        }}
      />
      <DeleteItemConfirmModal
        item={pendingDeleteItem}
        onConfirm={() => {
          if (pendingDeleteItem) {
            handleDeleteItem(pendingDeleteItem.id);
            setPendingDeleteItem(null);
          }
        }}
        onCancel={() => setPendingDeleteItem(null)}
      />
    </main>
  );
}
