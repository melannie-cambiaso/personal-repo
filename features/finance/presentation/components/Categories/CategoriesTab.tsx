"use client";

import { useState } from "react";
import { type Group } from "@/features/finance/data/kvAdapter";

interface CategoriesTabProps {
  groups: Group[];
  onAdd: (groupName: string, category: string) => Promise<void>;
  onDelete: (groupName: string, category: string) => Promise<void>;
}

export function CategoriesTab({ groups, onAdd, onDelete }: CategoriesTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <GroupSection key={group.name} group={group} onAdd={onAdd} onDelete={onDelete} />
      ))}
    </div>
  );
}

function GroupSection({
  group,
  onAdd,
  onDelete,
}: {
  group: Group;
  onAdd: (groupName: string, category: string) => Promise<void>;
  onDelete: (groupName: string, category: string) => Promise<void>;
}) {
  const [inputValue, setInputValue] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await onAdd(group.name, trimmed);
      setInputValue("");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (category: string) => {
    const confirmed = window.confirm(
      "Esta categoría tiene datos en el presupuesto. Si la eliminás, esos datos quedan guardados pero dejarán de verse. ¿Continuar?"
    );
    if (!confirmed) return;
    await onDelete(group.name, category);
  };

  return (
    <div className="border-cream-300 overflow-hidden rounded-xl border bg-white">
      <div className="border-cream-200 border-b px-4 py-3">
        <span className="text-brown-800 text-sm font-semibold">{group.name}</span>
      </div>

      <div className="divide-cream-100 flex flex-col divide-y">
        {group.categories.map((category) => (
          <div key={category} className="flex items-center justify-between px-4 py-2">
            <span className="text-brown-700 text-sm">{category}</span>
            <button
              onClick={() => handleDelete(category)}
              className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className="border-cream-200 flex items-center gap-2 border-t px-4 py-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleAdd();
          }}
          placeholder="Nueva categoría..."
          className="border-cream-400 bg-cream-50 text-brown-900 focus:border-brown-600 flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={adding || !inputValue.trim()}
          className="bg-brown-800 hover:bg-brown-700 cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
        >
          {adding ? "Agregando..." : "Agregar"}
        </button>
      </div>
    </div>
  );
}
