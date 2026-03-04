"use client";

import { useState, useRef } from "react";
import { Check, ShoppingCart, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FastRestockDrawer } from "./fast-restock-drawer";
import type { GroupedItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { vibrateSuccess } from "@/lib/haptics";

interface ShoppingListProps {
  items: GroupedItem[];
  onArchive: (id: string) => void;
}

const ARCHIVE_THRESHOLD = -100;
const MAX_DRAG = -150;

function SwipeableShoppingItem({
  item,
  inCart,
  onToggle,
  onArchive,
}: {
  item: GroupedItem;
  inCart: boolean;
  onToggle: () => void;
  onArchive: (id: string) => void;
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const touchStartX = useRef(0);
  const currentOffset = useRef(0);
  const didSwipe = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    currentOffset.current = swipeOffset;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const newOffset = Math.max(MAX_DRAG, Math.min(0, currentOffset.current + deltaX));
    setSwipeOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const totalDelta = Math.abs(swipeOffset - currentOffset.current);
    if (totalDelta > 5) didSwipe.current = true;

    if (swipeOffset < ARCHIVE_THRESHOLD) {
      setIsArchiving(true);
      setSwipeOffset(-300);
      setTimeout(() => onArchive(item.id), 300);
    } else {
      setSwipeOffset(0);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Coral reveal layer */}
      <div className="absolute inset-0 bg-pantry-coral flex items-center justify-end pr-5">
        <Trash2 className="size-5 text-pantry-ink animate-wobble" />
      </div>

      {/* Swipeable button */}
      <button
        onClick={() => {
          if (didSwipe.current) { didSwipe.current = false; return; }
          onToggle();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "flex items-center gap-3 px-2 py-3 border-b-2 border-pantry-ink/20 text-left w-full bg-background active:bg-pantry-ink/5",
          isDragging ? "transition-none" : "transition-all duration-200",
          isArchiving && "opacity-0 pointer-events-none"
        )}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        {/* Wobbly checkbox */}
        <div
          className={`shrink-0 size-6 rounded-[40%_60%_55%_45%] flex items-center justify-center transition-colors ${
            inCart
              ? "bg-pantry-teal border-2 border-pantry-ink"
              : "border-2 border-pantry-ink/40 bg-transparent"
          }`}
        >
          {inCart && <Check className="size-3.5 text-pantry-ink" strokeWidth={3} />}
        </div>

        {/* Name */}
        <span
          className={`flex-1 transition-colors ${
            inCart
              ? "line-through text-pantry-ink/40"
              : "font-handwritten font-semibold text-pantry-ink"
          }`}
        >
          {item.name}
        </span>

        {/* Quantity sticker */}
        <span className="shrink-0 text-xs font-handwritten font-bold bg-pantry-mustard/30 border border-pantry-ink/30 rounded-[50%_40%_50%_40%] px-2 py-0.5 text-pantry-ink/70">
          {item.quantity} {item.unit ?? "units"}
        </span>
      </button>
    </div>
  );
}

export function ShoppingList({ items, onArchive }: ShoppingListProps) {
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
        <ShoppingCart className="size-12 text-pantry-ink/30" />
        <div>
          <p className="font-handwritten font-semibold text-pantry-ink">Shopping list is empty</p>
          <p className="text-sm text-pantry-ink/50 mt-1">
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pantry-ink/40" />
          <Input
            placeholder="Search shopping list..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-pantry-paper border-2 border-pantry-ink rounded-[12px_18px_14px_16px] h-12 text-pantry-ink placeholder:text-pantry-ink/40 focus-visible:ring-0 focus-visible:border-pantry-teal pl-10"
          />
        </div>
        <div className="flex items-center justify-between px-1">
          <Label htmlFor="hide-checked" className="text-sm font-handwritten font-semibold text-pantry-ink">Hide found items</Label>
          <button
            role="switch"
            aria-checked={hideChecked}
            onClick={() => setHideChecked(!hideChecked)}
            className={`relative w-11 h-6 rounded-[8px_12px_10px_6px] border-2 border-pantry-ink transition-colors shrink-0
              ${hideChecked ? 'bg-pantry-teal' : 'bg-pantry-paper'}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-[40%_60%_55%_45%] bg-pantry-ink transition-all
              ${hideChecked ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-handwritten font-semibold text-pantry-ink/60 px-1">
            {foundItems} of {totalItems} items found
          </span>
          <div className="h-2 rounded-[4px_6px_4px_6px] bg-pantry-ink/10 overflow-hidden">
            <div
              className="h-full bg-pantry-teal transition-all"
              style={{ width: `${totalItems > 0 ? (foundItems / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grouped items */}
      <div className="px-3 py-2 flex flex-col">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="text-lg font-handwritten font-bold text-pantry-ink mt-6 mb-3 px-2">{category}</h3>
            <div className="flex flex-col">
              {categoryItems.map((item) => (
                <SwipeableShoppingItem
                  key={item.id}
                  item={item}
                  inCart={inCartIds.has(item.id)}
                  onToggle={() => toggleCart(item.id)}
                  onArchive={onArchive}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Restock button */}
      <div className="sticky bottom-20 px-4">
        <button
          className="w-full h-14 rounded-[14px_18px_16px_12px] border-2 border-pantry-ink bg-pantry-teal text-pantry-ink font-handwritten font-bold text-base shadow-[4px_4px_0px_0px_#1E293B] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-40 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
          disabled={inCartIds.size === 0}
          onClick={() => { vibrateSuccess(); setIsRestockDrawerOpen(true); }}
        >
          <ShoppingCart className="size-5 inline mr-2" />
          Restock {inCartIds.size > 0 ? inCartIds.size : ""} Item{inCartIds.size !== 1 ? "s" : ""} to Pantry
        </button>
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
