"use client";

import { useState } from "react";
import type { CategoryColor } from "@/features/wishlist/domain/Category";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";
import Image from "next/image";

const categoryBg: Record<CategoryColor, string> = {
  food: "bg-cat-food",
  sport: "bg-cat-sport",
  home: "bg-cat-home",
  books: "bg-cat-books",
  cloth: "bg-cat-cloth",
  tech: "bg-cat-tech",
};

const formatCLP = (n: number) => `$${n.toLocaleString("es-CL")}`;

interface Props extends WishlistItem {
  owned: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function WishlistItemCard({ owned, onToggle, onEdit, onDelete, ...props }: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`shadow-card bg-cream-50 flex flex-col overflow-hidden rounded-2xl transition-opacity ${owned ? "opacity-70" : ""} ${onEdit ? "cursor-pointer" : ""}`}
      onClick={onEdit}
    >
      {/* Image area */}
      <div className="bg-cream-300 relative h-55 overflow-hidden">
        {props.image && !imgError ? (
          <Image
            src={props.image}
            alt={props.title}
            fill
            className="object-cover"
            style={owned ? { filter: "grayscale(70%) opacity(0.6)" } : undefined}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl">{props.emoji}</span>
          </div>
        )}

        <span
          className={`absolute top-3 left-3 ${categoryBg[props.category.color]} text-2xs rounded-xl px-3 py-1 font-bold text-white uppercase`}
        >
          {props.category.name}
        </span>

        {owned && (
          <div className="bg-brown-800/25 absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-black text-white">✓</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="pt-4.5 flex flex-1 flex-col px-5 pb-5">
        <p className="text-2xs text-brown-400 tracking-store mb-1 font-semibold uppercase">
          {props.brand}
        </p>
        <h2 className="text-product text-brown-900 mb-2 leading-snug font-bold">{props.title}</h2>
        <p className="text-brown-600 mb-4 flex-1 text-sm leading-[1.55]">{props.description}</p>

        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            {props.tag && (
              <span className="text-2xs text-brown-400 bg-cream-500 mb-1.5 inline-block rounded-lg px-2 py-1">
                {props.tag}
              </span>
            )}
            <p className="text-brown-800 text-lg font-bold">
              {props.price !== null ? formatCLP(props.price) : "Ver precio"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {props.url && (
              <a
                href={props.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-2xs text-brown-800 border-brown-800 hover:bg-cream-300 rounded-lg border-[1.5px] px-3.5 py-2 font-bold transition-colors"
              >
                Ver →
              </a>
            )}
            {onDelete && (
              <button
                type="button"
                aria-label="Delete item"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-2xs cursor-pointer rounded-lg border border-red-200 px-3.5 py-2 font-bold text-red-500 transition-colors hover:bg-red-50"
              >
                ✕
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className={`text-2xs cursor-pointer rounded-lg px-3.5 py-2 font-bold text-white transition-colors ${
                owned ? "bg-brown-400" : "bg-brown-800 hover:bg-brown-700"
              }`}
            >
              {owned ? "Desmarcar" : "Lo tengo ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
