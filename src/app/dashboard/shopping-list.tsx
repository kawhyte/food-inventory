"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GroupedItem } from "@/lib/types";

interface ShoppingListProps {
  items: GroupedItem[];
}

export function ShoppingList({ items }: ShoppingListProps) {
  const [inCartIds, setInCartIds] = useState<Set<string>>(new Set());

  function toggleCart(id: string) {
    setInCartIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleRestock() {
    // Phase 23: call restockItems server action
    console.log("Restock:", Array.from(inCartIds));
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center">
        <ShoppingCart className="size-12 text-muted-foreground/40" />
        <div>
          <p className="font-medium">Shopping list is empty</p>
          <p className="text-sm text-muted-foreground mt-1">
            Toss or consume items to add them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-36">
      <div className="px-3 py-3 flex flex-col gap-2">
        {items.map((item) => {
          const inCart = inCartIds.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleCart(item.id)}
              className="flex items-center gap-4 p-4 bg-card rounded-2xl shadow-sm text-left w-full"
            >
              {/* Circular checkbox */}
              <div
                className={`shrink-0 size-6 rounded-full flex items-center justify-center transition-colors ${
                  inCart
                    ? "bg-primary"
                    : "border-2 border-muted-foreground/30"
                }`}
              >
                {inCart && <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />}
              </div>

              {/* Name */}
              <span
                className={`flex-1 font-medium transition-colors ${
                  inCart ? "line-through text-muted-foreground" : ""
                }`}
              >
                {item.name}
              </span>

              {/* Quantity + unit */}
              <span className="text-sm text-muted-foreground shrink-0">
                {item.quantity} {item.unit ?? "units"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sticky Restock button */}
      <div className="sticky bottom-20 px-4">
        <Button
          className="w-full h-14 rounded-full text-base shadow-lg"
          disabled={inCartIds.size === 0}
          onClick={handleRestock}
        >
          Restock {inCartIds.size > 0 ? inCartIds.size : ""} Item{inCartIds.size !== 1 ? "s" : ""} to Pantry
        </Button>
      </div>
    </div>
  );
}
