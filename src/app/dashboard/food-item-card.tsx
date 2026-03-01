"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GroupedItem } from "@/lib/types";
import { getGracePeriodDays } from "@/lib/expiration-rules";
import { incrementItemQuantity, decrementItemQuantity } from "./actions";

interface FoodItemCardProps {
  item: GroupedItem;
  onEdit: (item: GroupedItem) => void;
  onOpenDetail: (item: GroupedItem) => void;
}

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getCategoryColor(categoryName?: string): string {
  const name = (categoryName ?? "").toLowerCase();
  if (name.includes("produce")) return "bg-pantry-leaf";
  if (name.includes("dairy")) return "bg-pantry-sky";
  if (name.includes("meat") || name.includes("seafood") || name.includes("fish")) return "bg-pantry-coral";
  if (name.includes("grain") || name.includes("bread") || name.includes("bakery") || name.includes("pantry")) return "bg-pantry-mustard";
  if (name.includes("frozen")) return "bg-pantry-sky/80";
  if (name.includes("beverage") || name.includes("drink")) return "bg-pantry-teal";
  return "bg-pantry-mustard";
}

export function FoodItemCard({ item, onEdit, onOpenDetail }: FoodItemCardProps) {
  const [isPending, setIsPending] = useState(false);

  const daysUntil = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;
  const isPast = item.expiry_date ? new Date() > new Date(item.expiry_date) : false;
  const daysPast = isPast
    ? Math.floor((new Date().getTime() - new Date(item.expiry_date!).getTime()) / (1000 * 3600 * 24))
    : 0;
  const graceDays = getGracePeriodDays(item.categories?.name, item.locations?.name);
  const isHardExpired = isPast && daysPast > graceDays;

  let expiryText: string | null = null;
  let expiryColor: string | null = null;

  if (isHardExpired) {
    expiryText = "Expired";
    expiryColor = "text-red-500 font-medium";
  } else if (daysUntil !== null && daysUntil <= 2) {
    expiryText = `${daysUntil}d left`;
    expiryColor = "text-red-500";
  } else if (daysUntil !== null && daysUntil <= 3) {
    expiryText = `${daysUntil}d left`;
    expiryColor = "text-amber-500";
  }

  const qty = item.quantity;
  const unit = item.unit ?? "units";
  const categoryName = item.categories?.name ?? "Other";
  const categoryColor = getCategoryColor(item.categories?.name);

  const handleIncrement = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPending(true);
    const result = await incrementItemQuantity(item.id, qty);
    setIsPending(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast(`${item.name} +1`);
    }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPending(true);
    const result = await decrementItemQuantity(item.id, qty);
    setIsPending(false);
    if (result.error) {
      toast.error(result.error);
    } else if (result.deleted) {
      toast(`${item.name} removed.`);
    } else {
      toast(`${item.name} −1`);
    }
  };

  return (
    <div className="relative overflow-visible mt-2">
      {/* Category sticker */}
      <div
        className={cn(
          "absolute -top-3 right-3 z-10 border border-pantry-ink rounded-sm px-2 py-0.5 text-[10px] font-handwritten font-bold uppercase tracking-wider text-pantry-ink",
          categoryColor
        )}
      >
        {categoryName}
      </div>

      {/* Card */}
      <div
        className="bg-white border-2 border-pantry-ink rounded-xl shadow-[4px_4px_0px_0px_#1E293B] flex items-center gap-3 p-3 cursor-pointer active:shadow-[2px_2px_0px_0px_#1E293B] active:translate-x-[2px] active:translate-y-[2px] transition-all"
        onClick={() => onOpenDetail(item)}
      >
        {/* Left — product image or placeholder */}
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="aspect-square w-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="doodle-icon-placeholder aspect-square w-14 shrink-0 rounded-lg border-2 border-dashed border-pantry-ink/40" />
        )}

        {/* Center — item info */}
        <div className="flex-1 min-w-0">
          <p className="font-handwritten font-bold text-lg text-pantry-ink truncate">{item.name}</p>
          <p className="text-xs text-pantry-ink/60">
            {qty} {unit} · {categoryName}
          </p>
          {expiryText && (
            <p className={cn("text-xs", expiryColor)}>{expiryText}</p>
          )}
        </div>

        {/* Right — quantity stepper (horizontal: − qty +) */}
        <div
          className="flex flex-row items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={isPending}
            onClick={handleDecrement}
            className="w-8 h-8 rounded-full border-2 border-pantry-ink flex items-center justify-center font-bold text-lg leading-none active:bg-pantry-ink/10 disabled:opacity-50"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="text-sm font-bold tabular-nums w-5 text-center">{qty}</span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleIncrement}
            className="w-8 h-8 rounded-full border-2 border-pantry-ink flex items-center justify-center font-bold text-lg leading-none active:bg-pantry-ink/10 disabled:opacity-50"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export function FoodItemCardSkeleton() {
  return (
    <div className="relative">
      <div className="bg-pantry-ink/5 border-2 border-dashed border-pantry-ink/20 rounded-xl flex items-center gap-3 p-3 animate-pulse">
        <div className="aspect-square w-14 shrink-0 rounded-lg bg-pantry-ink/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-pantry-ink/10 rounded w-3/4" />
          <div className="h-3 bg-pantry-ink/10 rounded w-1/2" />
        </div>
        <div className="flex flex-row items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-pantry-ink/10" />
          <div className="w-5 h-4 bg-pantry-ink/10 rounded" />
          <div className="w-8 h-8 rounded-full bg-pantry-ink/10" />
        </div>
      </div>
    </div>
  );
}
