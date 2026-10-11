"use client";

import { useState } from "react";

// Inline name editor: clicking the name in edit mode opens an input that commits on blur
// or Enter, and cancels (reverts to saved name) on Escape.
export function InlineNameField({
  savedName,
  onCommit,
  className,
  inputClassName,
}: {
  savedName: string;
  onCommit: (name: string) => void;
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(savedName);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== savedName) onCommit(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      setDraft(savedName);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        title="Editar nombre"
        onClick={() => {
          setDraft(savedName);
          setEditing(true);
        }}
        className={`min-w-0 cursor-text truncate text-left decoration-dotted underline-offset-2 hover:underline ${className ?? ""}`}
      >
        {savedName}
      </button>
    );
  }

  return (
    <input
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={`border-surface-400 bg-surface-50 focus:ring-brand-500 min-w-0 rounded border px-1 py-0.5 focus:ring-2 focus:outline-none ${inputClassName ?? ""}`}
    />
  );
}
