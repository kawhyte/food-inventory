"use client";

import { Card } from "@/components/ui/card";
import { ShoppingBag, MoreHorizontal, TriangleAlert } from "lucide-react";
import type { GroupedItem } from "@/lib/types";

interface ItemCardProps {
  item: GroupedItem;
  onEdit: (item: GroupedItem) => void;
  onOpenDetail: (item: GroupedItem) => void;
  onOpenActionMenu: (item: GroupedItem) => void;
}

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function ItemCard({ item, onEdit, onOpenDetail, onOpenActionMenu }: ItemCardProps) {
  const daysUntil = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;
  const isPast = item.expiry_date ? new Date() > new Date(item.expiry_date) : false;

  return (
    <div className="relative">
      <Card
        className="border-none shadow-sm rounded-3xl overflow-hidden bg-card h-full flex flex-col hover:bg-muted/50 transition-colors active:scale-[0.98] transition-transform duration-200 cursor-pointer"
        onClick={() => onOpenDetail(item)}
      >
        {/* Image */}
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-32 w-full object-contain p-4 bg-white dark:bg-slate-900 rounded-t-3xl"
          />
        ) : (
          <div className="h-32 w-full bg-muted rounded-t-3xl flex items-center justify-center">
            <ShoppingBag className="size-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Content */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="font-bold leading-tight line-clamp-2">{item.name}</p>
          {item.categories?.name && (
            <p className="text-xs text-muted-foreground truncate">
              {item.categories.name}
            </p>
          )}
          <p className="text-xs font-medium text-muted-foreground">
            {item.quantity}{item.unit ? ` ${item.unit}` : ""}
          </p>
          {daysUntil !== null && (
            <p
              className={`text-xs mt-auto flex items-center gap-1 ${
                isPast && item.is_perishable
                  ? "text-destructive font-bold"
                  : isPast && !item.is_perishable
                  ? "text-orange-500 font-medium"
                  : daysUntil <= 2
                  ? "text-destructive font-bold"
                  : daysUntil <= 3
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              }`}
            >
              {!isPast && daysUntil <= 2 && daysUntil > 0 && (
                <TriangleAlert className="size-3 shrink-0" />
              )}
              {isPast && item.is_perishable
                ? `Expired: ${new Date(item.expiry_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : isPast && !item.is_perishable
                ? `Past Best By: ${new Date(item.expiry_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : daysUntil <= 3
                ? `${daysUntil}d left`
                : new Date(item.expiry_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>
      </Card>

      {/* Context Menu Button */}
      <button
        className="absolute top-2 right-2 z-10 flex items-center justify-center size-8 rounded-full bg-background/60 backdrop-blur-md border border-border/50 text-foreground shadow-sm active:scale-95 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onOpenActionMenu(item);
        }}
      >
        <MoreHorizontal className="size-4" />
      </button>
    </div>
  );
}
