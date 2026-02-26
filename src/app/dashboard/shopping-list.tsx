"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FastRestockDrawer } from "./fast-restock-drawer";
import type { GroupedItem } from "@/lib/types";

interface ShoppingListProps {
  items: GroupedItem[];
}

export function ShoppingList({ items }: ShoppingListProps) {
  const [inCartIds, setInCartIds] = useState<Set<string>>(new Set());
  const [isRestockDrawerOpen, setIsRestockDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideChecked, setHideChecked] = useState(false);

  function toggleCart(id: string) {
    setInCartIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const selectedItems = items.filter((item) => inCartIds.has(item.id));

  const totalItems = items.length;
  const foundItems = inCartIds.size;

  const filteredItems = items.filter((item) => {
    if (hideChecked && inCartIds.has(item.id)) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const groupedItems = filteredItems.reduce<Record<string, GroupedItem[]>>((acc, item) => {
    const key = item.categories?.name ?? "Uncategorized";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

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
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background px-3 pt-3 pb-2 flex flex-col gap-3">
        <Input
          placeholder="Search shopping list..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-muted/50 rounded-2xl h-12 border-none"
        />
        <div className="flex items-center justify-between px-1">
          <Label htmlFor="hide-checked" className="text-sm font-medium">Hide found items</Label>
          <Switch id="hide-checked" checked={hideChecked} onCheckedChange={setHideChecked} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground px-1">
            {foundItems} of {totalItems} items found
          </span>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${totalItems > 0 ? (foundItems / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grouped items */}
      <div className="px-3 py-2 flex flex-col">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="text-lg font-bold mt-6 mb-3 px-2">{category}</h3>
            <div className="flex flex-col gap-2">
              {categoryItems.map((item) => {
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
          </div>
        ))}
      </div>

      {/* Sticky Restock button */}
      <div className="sticky bottom-20 px-4">
        <Button
          className="w-full h-14 rounded-full text-base shadow-lg"
          disabled={inCartIds.size === 0}
          onClick={() => setIsRestockDrawerOpen(true)}
        >
          Restock {inCartIds.size > 0 ? inCartIds.size : ""} Item{inCartIds.size !== 1 ? "s" : ""} to Pantry
        </Button>
      </div>

      <FastRestockDrawer
        open={isRestockDrawerOpen}
        onOpenChange={setIsRestockDrawerOpen}
        itemsToRestock={selectedItems}
        onComplete={() => {
          setInCartIds(new Set());
          toast.success("Groceries put away!");
        }}
      />
    </div>
  );
}
