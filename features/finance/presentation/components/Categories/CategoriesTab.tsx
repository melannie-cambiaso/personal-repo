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
    <div className="overflow-hidden rounded-xl border border-cream-300 bg-white">
      <div className="border-b border-cream-200 px-4 py-3">
        <span className="text-sm font-semibold text-brown-800">{group.name}</span>
      </div>

      <div className="flex flex-col divide-y divide-cream-100">
        {group.categories.map((category) => (
          <div key={category} className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-brown-700">{category}</span>
            <button
              onClick={() => handleDelete(category)}
              className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-cream-200 px-4 py-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleAdd();
          }}
          placeholder="Nueva categoría..."
          className="flex-1 rounded-lg border border-cream-400 bg-cream-50 px-3 py-1.5 text-sm text-brown-900 outline-none focus:border-brown-600"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={adding || !inputValue.trim()}
          className="cursor-pointer rounded-lg bg-brown-800 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brown-700 disabled:opacity-50"
        >
          {adding ? "Agregando..." : "Agregar"}
        </button>
      </div>
    </div>
  );
}
